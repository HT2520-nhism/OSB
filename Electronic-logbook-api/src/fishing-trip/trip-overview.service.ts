/**
 * Aggregation Service - Returns all data needed for a single fishing-trip
 * detail screen in one request.
 *
 * Architecture:
 * - One endpoint per screen → 1 client API call
 * - Composed from existing domain entities (no new tables)
 * - User-scoped authorization via AuthorizationService.assertCanAccessTrip
 * - Parallel internal queries using Promise.all to minimize latency
 *
 * Note: Document Service is a separate microservice. The aggregation
 * fetches document metadata from this service's local mirror
 * (the document_id reference is what the eLogbook DB stores). For
 * full document previews, clients query document-api directly.
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FishingTrip } from './fishing-trip.entity';
import { Vessel } from '../vessel/vessel.entity';
import { FishingTripCrew } from '../fishing-trip-crew/fishing-trip-crew.entity';
import { FishingTripGear } from '../fishing-trip-gear/fishing-trip-gear.entity';
import { FishingOperation } from '../fishing-operation/fishing-operation.entity';
import { CatchRecord } from '../catch-record/catch-record.entity';
import { LandingRecord } from '../landing-record/landing-record.entity';
import { LandingCatch } from '../landing-catch/landing-catch.entity';
import { PortCall } from '../port-call/port-call.entity';
import { FuelRecord } from '../fuel-record/fuel-record.entity';
import { Incident } from '../incident/incident.entity';
import { FormSubmission } from '../form-submission/form-submission.entity';

import { FormDefinitionService } from '../form-definition/form-definition.service';
import { AuthorizationService } from '../auth/authorization.service';
import type { AuthUser } from '../auth/current-user.decorator';

import { FishingTripStatus } from '../constants/enums/domain.enum';

const TRIP_STATUS_ORDER: FishingTripStatus[] = [
  FishingTripStatus.DRAFT,
  FishingTripStatus.PREPARING,
  FishingTripStatus.DEPARTED,
  FishingTripStatus.FISHING,
  FishingTripStatus.RETURNING,
  FishingTripStatus.COMPLETED,
  FishingTripStatus.CANCELLED,
];

@Injectable()
export class TripOverviewService {
  private readonly logger = new Logger('TripOverviewService');

  constructor(
    @InjectRepository(FishingTrip)
    private readonly tripRepo: Repository<FishingTrip>,
    @InjectRepository(Vessel)
    private readonly vesselRepo: Repository<Vessel>,
    @InjectRepository(FishingTripCrew)
    private readonly tripCrewRepo: Repository<FishingTripCrew>,
    @InjectRepository(FishingTripGear)
    private readonly tripGearRepo: Repository<FishingTripGear>,
    @InjectRepository(FishingOperation)
    private readonly operationRepo: Repository<FishingOperation>,
    @InjectRepository(CatchRecord)
    private readonly catchRepo: Repository<CatchRecord>,
    @InjectRepository(LandingRecord)
    private readonly landingRepo: Repository<LandingRecord>,
    @InjectRepository(LandingCatch)
    private readonly landingCatchRepo: Repository<LandingCatch>,
    @InjectRepository(PortCall)
    private readonly portCallRepo: Repository<PortCall>,
    @InjectRepository(FuelRecord)
    private readonly fuelRepo: Repository<FuelRecord>,
    @InjectRepository(Incident)
    private readonly incidentRepo: Repository<Incident>,
    @InjectRepository(FormSubmission)
    private readonly formSubRepo: Repository<FormSubmission>,
    private readonly formDefService: FormDefinitionService,
    private readonly authz: AuthorizationService,
  ) {}

  /**
   * Returns a single aggregated overview for a fishing trip.
   *
   * 1. Authorize user access via AuthorizationService.assertCanAccessTrip
   * 2. Fetch trip + vessel in one trip
   * 3. Parallel fetch of all related collections
   * 4. Compose client-ready DTO
   */
  async getOverview(tripId: string, user: AuthUser): Promise<any> {
    if (!this.authz.isSuperAdmin(user)) {
      await this.authz.assertCanAccessTrip(tripId, user);
    }

    const trip = await this.tripRepo.findOne({
      where: { id: tripId },
      relations: { vessel: true },
    });
    if (!trip) {
      throw new NotFoundException(`FishingTrip ${tripId} not found`);
    }

    const [
      tripCrew,
      tripGear,
      operations,
      landings,
      portCalls,
      fuelRecords,
      incidents,
      formSubmissions,
    ] = await Promise.all([
      this.tripCrewRepo.find({
        where: { fishingTripId: tripId },
        order: { joinedAt: 'ASC' },
      }),
      this.tripGearRepo.find({ where: { fishingTripId: tripId } }),
      this.operationRepo.find({
        where: { fishingTripId: tripId },
        order: { operationStartedAt: 'ASC' },
      }),
      this.landingRepo.find({
        where: { fishingTripId: tripId },
        order: { landedAt: 'ASC' },
      }),
      this.portCallRepo.find({
        where: { fishingTripId: tripId },
        order: { occurredAt: 'ASC' },
      }),
      this.fuelRepo.find({ where: { fishingTripId: tripId } }),
      this.incidentRepo.find({ where: { fishingTripId: tripId } }),
      this.formSubRepo.find({ where: { fishingTripId: tripId } }),
    ]);

    // Fetch catch records for all operations
    const operationIds = operations.map((o) => o.id);
    const allCatches = operationIds.length
      ? await this.catchRepo
          .createQueryBuilder('c')
          .where('c.fishing_operation_id IN (:...ids)', { ids: operationIds })
          .getMany()
      : [];

    // Fetch landing catches for all landings
    const landingIds = landings.map((l) => l.id);
    const allLandingCatches = landingIds.length
      ? await this.landingCatchRepo
          .createQueryBuilder('lc')
          .where('lc.landing_record_id IN (:...ids)', { ids: landingIds })
          .getMany()
      : [];

    // Fetch form definitions for M01/M02/M03 in a single round-trip.
    // We look up the ACTIVE definition for each regulatory code (parallel),
    // then build the code → definition map. This replaces the previous
    // approach that pulled every FormDefinition touched by any submission.
    const [m01Defs, m02Defs, m03Defs] = await Promise.all([
      this.formDefService.findActiveByCodeSafe('M01'),
      this.formDefService.findActiveByCodeSafe('M02'),
      this.formDefService.findActiveByCodeSafe('M03'),
    ]);
    const allMDefs = [...m01Defs, ...m02Defs, ...m03Defs];
    const formCodeByDefId = new Map(
      allMDefs.map((fd) => [fd.id, fd.formCode] as const),
    );

    // ── Compose ─────────────────────────────────────────────────────
    const captain = tripCrew.find((c) => c.crewRole === 'CAPTAIN');

    const catchesByOperation = groupBy(allCatches, (c) => c.fishingOperationId);
    const landingCatchesByLanding = groupBy(
      allLandingCatches,
      (c) => c.landingRecordId,
    );

    const enrichedOps = operations.map((op) => ({
      id: op.id,
      latitude: op.latitude ? Number(op.latitude) : undefined,
      longitude: op.longitude ? Number(op.longitude) : undefined,
      operationStartedAt: op.operationStartedAt,
      operationEndedAt: op.operationEndedAt,
      operationType: op.operationType,
      fishingGearType: op.fishingGearType,
      fishingGround: op.fishingGround,
      depth: op.depth ? Number(op.depth) : undefined,
      catches: (catchesByOperation.get(op.id) || []).map(toCatchDto),
    }));

    const enrichedLandings = landings.map((l) => ({
      id: l.id,
      landingPortCode: l.landingPortCode,
      landedAt: l.landedAt,
      totalQuantity: l.totalQuantity ? Number(l.totalQuantity) : undefined,
      catches: (landingCatchesByLanding.get(l.id) || []).map(toLandingCatchDto),
    }));

    const formRefs = {
      m01: pickForm(formSubmissions, formCodeByDefId, 'M01'),
      m02: pickForm(formSubmissions, formCodeByDefId, 'M02'),
      m03: pickForm(formSubmissions, formCodeByDefId, 'M03'),
      nkkt: pickForm(formSubmissions, formCodeByDefId, 'NKKT'),
    };

    const catchBySpeciesMap = aggregateCatchesBySpecies(allCatches);
    const totalCatchWeight = allCatches.reduce(
      (sum, c) => sum + (c.quantity ? Number(c.quantity) : 0),
      0,
    );

    return {
      trip: toTripDto(trip),
      vessel: trip.vessel ? toVesselDto(trip.vessel) : null,
      captain: captain
        ? {
            userId: captain.userId,
            fullName: undefined,
            fishermanCode: undefined,
            crewRole: captain.crewRole,
            joinedAt: captain.joinedAt,
          }
        : undefined,
      crew: tripCrew.map(toTripCrewDto),
      gear: tripGear.map(toTripGearDto),
      operations: enrichedOps,
      catchSummary: {
        totalWeight: round3(totalCatchWeight),
        speciesCount: catchBySpeciesMap.size,
      },
      catchBySpecies: Array.from(catchBySpeciesMap.values()).map(
        toCatchSpeciesDto,
      ),
      landings: enrichedLandings,
      portCalls: portCalls.map(toPortCallDto),
      incidents: incidents.map(toIncidentDto),
      fuelRecords: fuelRecords.map(toFuelRecordDto),
      forms: formRefs,
      workflow: buildWorkflow(trip.status as FishingTripStatus),
    };
  }
}

// ─── helpers ─────────────────────────────────────────────────────────────

function groupBy<T, K>(arr: T[], key: (t: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of arr) {
    const k = key(item);
    const existing = map.get(k);
    if (existing) existing.push(item);
    else map.set(k, [item]);
  }
  return map;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function aggregateCatchesBySpecies(
  catches: CatchRecord[],
): Map<string, { code: string; name: string; qty: number; unit: string }> {
  const map = new Map<
    string,
    { code: string; name: string; qty: number; unit: string }
  >();
  for (const c of catches) {
    const code = c.speciesCode || 'UNKNOWN';
    const qty = c.quantity ? Number(c.quantity) : 0;
    const existing = map.get(code);
    if (existing) {
      existing.qty = round3(existing.qty + qty);
    } else {
      map.set(code, {
        code,
        name: c.speciesName || code,
        qty: round3(qty),
        unit: c.unit || 'kg',
      });
    }
  }
  return map;
}

function pickForm(
  submissions: FormSubmission[],
  codeByDefId: Map<string, string>,
  formCode: string,
) {
  for (const fs of submissions) {
    if (!fs.formDefinitionId) continue;
    if (codeByDefId.get(fs.formDefinitionId) === formCode) {
      return {
        id: fs.id,
        status: fs.status,
        submittedAt: fs.submittedAt,
        version: fs.version,
      };
    }
  }
  return null;
}

function buildWorkflow(status: FishingTripStatus) {
  const idx = TRIP_STATUS_ORDER.indexOf(status);
  const completedSteps =
    idx > 0 ? TRIP_STATUS_ORDER.slice(0, idx).filter((s) => s !== 'DRAFT') : [];
  const next: Partial<Record<FishingTripStatus, string>> = {
    DRAFT: 'PREPARING',
    PREPARING: 'DEPARTED',
    DEPARTED: 'FISHING',
    FISHING: 'RETURNING',
    RETURNING: 'COMPLETED',
  };
  return {
    currentStep: status,
    completedSteps,
    nextStep: next[status] ?? null,
    requiredActions: [],
    canDepart: status === 'PREPARING',
    canStartFishing: status === 'DEPARTED',
    canReturn: status === 'FISHING',
    canComplete: status === 'RETURNING',
  };
}

// ─── DTO mappers ─────────────────────────────────────────────────────────

function toTripDto(t: FishingTrip) {
  return {
    id: t.id,
    tripNumber: t.tripNumber,
    status: t.status,
    submissionStatus: t.submissionStatus,
    departurePortCode: t.departurePortCode,
    arrivalPortCode: t.arrivalPortCode,
    departureAt: t.departureAt,
    arrivalAt: t.arrivalAt,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

function toVesselDto(v: Vessel) {
  return {
    id: v.id,
    registrationNumber: v.registrationNumber,
    vesselName: v.vesselName,
    vesselType: v.vesselType,
    length: v.length ? Number(v.length) : undefined,
    width: v.width ? Number(v.width) : undefined,
    depth: v.depth ? Number(v.depth) : undefined,
    grossTonnage: v.grossTonnage ? Number(v.grossTonnage) : undefined,
    enginePower: v.enginePower ? Number(v.enginePower) : undefined,
    status: v.status,
    provinceCode: v.provinceCode,
    districtCode: v.districtCode,
    wardCode: v.wardCode,
  };
}

function toTripCrewDto(c: FishingTripCrew) {
  return {
    id: c.id,
    userId: c.userId,
    fullName: undefined,
    fishermanCode: undefined,
    crewRole: c.crewRole,
    joinedAt: c.joinedAt,
    leftAt: c.leftAt,
  };
}

function toTripGearDto(g: FishingTripGear) {
  return {
    id: g.id,
    name: g.fishingGearId, // gear name lookup not done here; client can resolve if needed
    gearType: g.gearType,
    quantity: g.quantity ? Number(g.quantity) : undefined,
  };
}

function toCatchDto(c: CatchRecord) {
  return {
    id: c.id,
    speciesCode: c.speciesCode,
    speciesName: c.speciesName,
    quantity: c.quantity ? Number(c.quantity) : undefined,
    unit: c.unit,
    estimatedQuantity: c.estimatedQuantity
      ? Number(c.estimatedQuantity)
      : undefined,
    condition: c.condition,
    notes: c.notes,
  };
}

function toLandingCatchDto(c: LandingCatch) {
  return {
    id: c.id,
    speciesCode: c.speciesCode,
    speciesName: c.speciesName,
    quantity: c.quantity ? Number(c.quantity) : undefined,
    unit: c.unit,
  };
}

function toCatchSpeciesDto(s: {
  code: string;
  name: string;
  qty: number;
  unit: string;
}) {
  return {
    speciesCode: s.code,
    speciesName: s.name,
    totalQuantity: s.qty,
    unit: s.unit,
  };
}

function toPortCallDto(p: PortCall) {
  return {
    id: p.id,
    portCode: p.portCode,
    callType: p.callType,
    occurredAt: p.occurredAt,
    latitude: p.latitude ? Number(p.latitude) : undefined,
    longitude: p.longitude ? Number(p.longitude) : undefined,
    reason: p.reason,
    notes: p.notes,
  };
}

function toFuelRecordDto(f: FuelRecord) {
  return {
    id: f.id,
    recordType: f.recordType,
    quantity: f.quantity ? Number(f.quantity) : undefined,
    unit: f.unit,
    occurredAt: f.occurredAt,
    location: f.location,
    notes: f.notes,
  };
}

function toIncidentDto(i: Incident) {
  return {
    id: i.id,
    incidentType: i.incidentType,
    severity: i.severity,
    occurredAt: i.occurredAt,
    description: i.description,
    actionTaken: i.actionTaken,
  };
}
