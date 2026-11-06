/**
 * PHASE 5.7-5.9 — Regulatory Forms Service.
 *
 * Implements the three business workflows from Phụ lục II:
 *
 *  Mẫu 01 — Giấy biên nhận sản phẩm thủy sản khai thác bốc dỡ
 *  Mẫu 02 — Biên bản kiểm tra tàu cá cập cảng
 *  Mẫu 03 — Biên bản kiểm tra tàu cá rời cảng
 *
 * Authoritative data is resolved from the existing domain entities;
 * the client only contributes what is genuinely form-local.
 */

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FormDefinition } from '../form-definition/form-definition.entity';
import { Vessel } from '../vessel/vessel.entity';
import { VesselOwner } from '../vessel-owner/vessel-owner.entity';
import { VesselCrew } from '../vessel-crew/vessel-crew.entity';
import { FishingTrip } from '../fishing-trip/fishing-trip.entity';
import { FishingTripCrew } from '../fishing-trip-crew/fishing-trip-crew.entity';
import { FishingTripGear } from '../fishing-trip-gear/fishing-trip-gear.entity';
import { LandingRecord } from '../landing-record/landing-record.entity';
import { LandingCatch } from '../landing-catch/landing-catch.entity';
import { FishingOperation } from '../fishing-operation/fishing-operation.entity';
import { CatchRecord } from '../catch-record/catch-record.entity';

import { FormSubmissionService } from '../form-submission/form-submission.service';
import { AuthUser } from '../auth/current-user.decorator';
import { AuthorizationService } from '../auth/authorization.service';

import { RegulatoryFormCode } from '../constants/enums/domain.enum';
import { getVesselLengthCategory } from '../domain/vessel-length-category';

import { Logger } from '../services/logger.service';

export interface SpeciesPurchase {
  speciesCode?: string;
  speciesName?: string;
  harvestedQuantity?: string;
  purchasedQuantity?: string;
  unit?: string;
  /** Optional buyer information */
  buyerName?: string;
  buyerOrganization?: string;
  buyerAddress?: string;
}

export interface CreateM01Input {
  vesselId: string;
  fishingTripId?: string | null;
  issuanceDate: string; // ISO date string
  captainName?: string;
  captainIdNumber?: string;
  fishingLicenseNumber?: string;
  fishingLicenseExpiry?: string;
  lengthCategoryOverride?: string;
  buyerName?: string;
  buyerAddress?: string;
  speciesList?: SpeciesPurchase[];
  sectionB?: Record<string, any>;
  sectionC?: Record<string, any>;
  notes?: string;
}

export interface DocumentCheck {
  fishingReport?: boolean;
  fishingLogbook?: boolean;
}

export interface CreateM02Input {
  vesselId: string;
  fishingTripId?: string | null;
  inspectionDate: string;
  inspectionUnit: string;
  inspectors: string[];
  documentChecks: DocumentCheck;
  reportedCatchQuantity?: string;
  actualCatchQuantity?: string;
  speciesChecks?: any[];
  conclusion?: string;
  notes?: string;
}

export type EquipmentStatus = 'D' | 'T';

export interface EquipmentCheck {
  navigationEquipment?: EquipmentStatus;
  lifesavingFirefighting?: EquipmentStatus;
  communicationSignaling?: EquipmentStatus;
  vesselMonitoring?: EquipmentStatus;
}

export type FishingOccupationM03 =
  | 'TRAWL'
  | 'PURSE_SEINE'
  | 'SURROUNDING_NET'
  | 'HOOK_LINE'
  | 'GILLNET'
  | 'TRAPS_CAGES'
  | 'OTHER'
  | 'VESSEL_MARKING';

export interface CreateM03Input {
  vesselId: string;
  fishingTripId?: string | null;
  inspectionDate: string;
  inspectionUnit: string;
  inspectors: string[];
  documents: {
    vesselRegistration?: boolean;
    crewList?: boolean;
    technicalSafetyCertificate?: boolean;
    captainQualification?: boolean;
    fishingLicense?: boolean;
    chiefEngineerQualification?: boolean;
    fishingLogbookOrPurchase?: boolean;
    foodSafetyCertificate?: boolean;
  };
  equipment: EquipmentCheck;
  fishingOccupations: FishingOccupationM03[];
  otherOccupation?: string;
  crewCount?: number;
  previousTripSubmission?: {
    fishingReportSubmitted?: boolean;
    fishingLogbookSubmitted?: boolean;
  };
  conclusion?: string;
  notes?: string;
}

export interface CreateNKKTInput {
  vesselId: string;
  fishingTripId?: string | null;
  tripIdentifier?: string;
  mainOccupation?: string;
  subOccupation1?: string;
  subOccupation2?: string;
  gearSpecifications?: Record<string, unknown>;
  operationsSummary?: any[];
  endangeredSpecies?: any[];
  transshipments?: any[];
  logbookNumber?: string;
  notes?: string;
}

@Injectable()
export class RegulatoryFormsService {
  /* istanbul ignore next */
  private readonly logger = new Logger('RegulatoryFormsService');

  constructor(
    @InjectRepository(FormDefinition)
    private readonly defRepo: Repository<FormDefinition>,
    @InjectRepository(Vessel)
    private readonly vesselRepo: Repository<Vessel>,
    @InjectRepository(VesselOwner)
    private readonly ownerRepo: Repository<VesselOwner>,
    @InjectRepository(VesselCrew)
    private readonly vesselCrewRepo: Repository<VesselCrew>,
    @InjectRepository(FishingTrip)
    private readonly tripRepo: Repository<FishingTrip>,
    @InjectRepository(FishingTripCrew)
    private readonly tripCrewRepo: Repository<FishingTripCrew>,
    @InjectRepository(FishingTripGear)
    private readonly tripGearRepo: Repository<FishingTripGear>,
    @InjectRepository(LandingRecord)
    private readonly landingRepo: Repository<LandingRecord>,
    @InjectRepository(LandingCatch)
    private readonly catchRepo: Repository<LandingCatch>,
    private readonly submissionService: FormSubmissionService,
    private readonly authService: AuthorizationService,
    @InjectRepository(FishingOperation)
    private readonly operationRepo: Repository<FishingOperation>,
    @InjectRepository(CatchRecord)
    private readonly catchRecordRepo: Repository<CatchRecord>,
  ) {}

  // ─── Mẫu 01 — Giấy biên nhận sản phẩm thủy sản khai thác bốc dỡ ──

  async createM01(input: CreateM01Input, user: AuthUser) {
    this.logger.log({
      event: 'm01.create',
      vesselId: input.vesselId,
      by: user.accountId,
    });
    const vessel = await this.vesselRepo.findOne({
      where: { id: input.vesselId },
    });
    if (!vessel)
      throw new NotFoundException(`Vessel ${input.vesselId} not found`);

    await this.authService.assertCanAccessVessel(vessel.id, user);

    let trip: FishingTrip | null = null;
    if (input.fishingTripId) {
      const t = await this.tripRepo.findOne({
        where: { id: input.fishingTripId },
      });
      if (!t) {
        throw new NotFoundException(
          `FishingTrip ${input.fishingTripId} not found`,
        );
      }
      if (t.vesselId !== vessel.id) {
        throw new BadRequestException(
          `FishingTrip ${t.id} does not belong to vessel ${vessel.id}`,
        );
      }
      trip = t;
    }

    const owners = await this.ownerRepo.find({
      where: { vesselId: vessel.id, isCurrent: true },
    });
    const captainFromTripCrew = trip
      ? await this.tripCrewRepo.findOne({
          where: { fishingTripId: trip.id, crewRole: 'CAPTAIN' },
        })
      : null;
    const captainFromVesselCrew = await this.vesselCrewRepo.findOne({
      where: { vesselId: vessel.id, crewRole: 'CAPTAIN', isActive: true },
    });

    const gearList = trip
      ? await this.tripGearRepo.find({ where: { fishingTripId: trip.id } })
      : [];

    const landings = trip
      ? await this.landingRepo.find({ where: { fishingTripId: trip.id } })
      : [];
    const landingIds = landings.map((l) => l.id);
    const landingCatches = landingIds.length
      ? await this.catchRepo
          .createQueryBuilder('c')
          .where('c.landing_record_id IN (:...ids)', { ids: landingIds })
          .getMany()
      : [];

    // Try to resolve species quantities from existing landings when the
    // client didn't supply a species list explicitly.
    const speciesList =
      input.speciesList && input.speciesList.length > 0
        ? input.speciesList
        : landingCatches.map((c) => ({
            speciesCode: c.speciesCode ?? undefined,
            speciesName: c.speciesName ?? undefined,
            harvestedQuantity: c.quantity ?? undefined,
            purchasedQuantity: c.quantity ?? undefined,
            unit: c.unit ?? undefined,
          }));

    const lengthCategory =
      input.lengthCategoryOverride ??
      getVesselLengthCategory(vessel.length) ??
      null;

    const def = await this.defRepo.findOne({
      where: { formCode: RegulatoryFormCode.M01, isActive: true },
    });
    if (!def) {
      throw new NotFoundException(
        `Active FormDefinition for code ${RegulatoryFormCode.M01} not found`,
      );
    }

    const formData = {
      formCode: RegulatoryFormCode.M01,
      issuanceDate: input.issuanceDate,
      vessel: {
        id: vessel.id,
        registrationNumber: vessel.registrationNumber,
        vesselName: vessel.vesselName,
        vesselType: vessel.vesselType,
        length: vessel.length,
        lengthCategory,
        provinceCode: vessel.provinceCode,
      },
      owner: owners[0]
        ? {
            userId: owners[0].userId,
            ownershipType: owners[0].ownershipType,
          }
        : null,
      captain: input.captainName
        ? {
            name: input.captainName,
            idNumber: input.captainIdNumber,
            userId:
              captainFromTripCrew?.userId ??
              captainFromVesselCrew?.userId ??
              null,
          }
        : captainFromTripCrew || captainFromVesselCrew
        ? {
            userId:
              captainFromTripCrew?.userId ??
              captainFromVesselCrew?.userId ??
              null,
          }
        : null,
      fishingLicense: {
        number: input.fishingLicenseNumber ?? null,
        expiry: input.fishingLicenseExpiry ?? null,
      },
      gear: gearList.map((g) => ({
        gearType: g.gearType,
        quantity: g.quantity,
        fishingGearId: g.fishingGearId,
      })),
      buyer: input.buyerName
        ? {
            name: input.buyerName,
            address: input.buyerAddress ?? null,
          }
        : null,
      speciesList: speciesList.map((s) => ({
        speciesCode: s.speciesCode ?? null,
        speciesName: s.speciesName ?? null,
        harvestedQuantity: s.harvestedQuantity ?? null,
        purchasedQuantity: s.purchasedQuantity ?? null,
        unit: s.unit ?? null,
        buyerName: s.buyerName ?? input.buyerName ?? null,
        buyerOrganization: s.buyerOrganization ?? null,
        buyerAddress: s.buyerAddress ?? input.buyerAddress ?? null,
      })),
      notes: input.notes ?? null,
      sectionB: input.sectionB ?? null,
      sectionC: input.sectionC ?? null,
    };

    return this.submissionService.createForm(
      {
        formDefinitionId: def.id,
        vesselId: vessel.id,
        fishingTripId: trip?.id ?? null,
        data: formData,
      },
      user,
    );
  }

  // ─── Mẫu 02 — Biên bản kiểm tra tàu cá cập cảng ─────────────────

  async createM02(input: CreateM02Input, user: AuthUser) {
    this.logger.log({
      event: 'm02.create',
      vesselId: input.vesselId,
      by: user.accountId,
    });
    const vessel = await this.vesselRepo.findOne({
      where: { id: input.vesselId },
    });
    if (!vessel)
      throw new NotFoundException(`Vessel ${input.vesselId} not found`);

    await this.authService.assertCanAccessVessel(vessel.id, user);

    let trip: FishingTrip | null = null;
    if (input.fishingTripId) {
      const t = await this.tripRepo.findOne({
        where: { id: input.fishingTripId },
      });
      if (!t) {
        throw new NotFoundException(
          `FishingTrip ${input.fishingTripId} not found`,
        );
      }
      if (t.vesselId !== vessel.id) {
        throw new BadRequestException(
          `FishingTrip ${t.id} does not belong to vessel ${vessel.id}`,
        );
      }
      trip = t;
    }

    const owner = await this.ownerRepo.findOne({
      where: { vesselId: vessel.id, isCurrent: true },
    });
    const captainFromTripCrew = trip
      ? await this.tripCrewRepo.findOne({
          where: { fishingTripId: trip.id, crewRole: 'CAPTAIN' },
        })
      : null;

    const def = await this.defRepo.findOne({
      where: { formCode: RegulatoryFormCode.M02, isActive: true },
    });
    if (!def) {
      throw new NotFoundException(
        `Active FormDefinition for code ${RegulatoryFormCode.M02} not found`,
      );
    }

    const formData = {
      formCode: RegulatoryFormCode.M02,
      inspectionDate: input.inspectionDate,
      inspectionUnit: input.inspectionUnit,
      inspectors: input.inspectors,
      vessel: {
        id: vessel.id,
        registrationNumber: vessel.registrationNumber,
        vesselName: vessel.vesselName,
      },
      owner: owner
        ? {
            userId: owner.userId,
            ownershipType: owner.ownershipType,
          }
        : null,
      captain: captainFromTripCrew
        ? { userId: captainFromTripCrew.userId }
        : null,
      documentChecks: input.documentChecks,
      reportedCatchQuantity: input.reportedCatchQuantity ?? null,
      actualCatchQuantity: input.actualCatchQuantity ?? null,
      speciesChecks: input.speciesChecks ?? [],
      conclusion: input.conclusion ?? null,
      notes: input.notes ?? null,
    };

    return this.submissionService.createForm(
      {
        formDefinitionId: def.id,
        vesselId: vessel.id,
        fishingTripId: trip?.id ?? null,
        data: formData,
      },
      user,
    );
  }

  // ─── Mẫu 03 — Biên bản kiểm tra tàu cá rời cảng ─────────────────

  async createM03(input: CreateM03Input, user: AuthUser) {
    this.logger.log({
      event: 'm03.create',
      vesselId: input.vesselId,
      by: user.accountId,
    });
    const vessel = await this.vesselRepo.findOne({
      where: { id: input.vesselId },
    });
    if (!vessel)
      throw new NotFoundException(`Vessel ${input.vesselId} not found`);

    await this.authService.assertCanAccessVessel(vessel.id, user);

    let trip: FishingTrip | null = null;
    if (input.fishingTripId) {
      const t = await this.tripRepo.findOne({
        where: { id: input.fishingTripId },
      });
      if (!t) {
        throw new NotFoundException(
          `FishingTrip ${input.fishingTripId} not found`,
        );
      }
      if (t.vesselId !== vessel.id) {
        throw new BadRequestException(
          `FishingTrip ${t.id} does not belong to vessel ${vessel.id}`,
        );
      }
      trip = t;
    }

    const def = await this.defRepo.findOne({
      where: { formCode: RegulatoryFormCode.M03, isActive: true },
    });
    if (!def) {
      throw new NotFoundException(
        `Active FormDefinition for code ${RegulatoryFormCode.M03} not found`,
      );
    }

    const formData = {
      formCode: RegulatoryFormCode.M03,
      inspectionDate: input.inspectionDate,
      inspectionUnit: input.inspectionUnit,
      inspectors: input.inspectors,
      vessel: {
        id: vessel.id,
        registrationNumber: vessel.registrationNumber,
        vesselName: vessel.vesselName,
      },
      documents: input.documents,
      equipment: input.equipment,
      fishingOccupations: input.fishingOccupations,
      otherOccupation: input.otherOccupation ?? null,
      crewCount: input.crewCount ?? null,
      previousTripSubmission: input.previousTripSubmission ?? null,
      conclusion: input.conclusion ?? null,
      notes: input.notes ?? null,
    };

    return this.submissionService.createForm(
      {
        formDefinitionId: def.id,
        vesselId: vessel.id,
        fishingTripId: trip?.id ?? null,
        data: formData,
      },
      user,
    );
  }

  // ─── NKKT — Nhật ký khai thác thủy sản (Thông tư 01/2022/TT-BNNPTNT) ─

  async createNKKT(input: CreateNKKTInput, user: AuthUser) {
    this.logger.log({
      event: 'nkkt.create',
      vesselId: input.vesselId,
      by: user.accountId,
    });
    const vessel = await this.vesselRepo.findOne({
      where: { id: input.vesselId },
    });
    if (!vessel) {
      throw new NotFoundException(`Vessel ${input.vesselId} not found`);
    }

    await this.authService.assertCanAccessVessel(vessel.id, user);

    let trip: FishingTrip | null = null;
    if (input.fishingTripId) {
      const t = await this.tripRepo.findOne({
        where: { id: input.fishingTripId },
      });
      if (!t) {
        throw new NotFoundException(`FishingTrip ${input.fishingTripId} not found`);
      }
      if (t.vesselId !== vessel.id) {
        throw new BadRequestException(`FishingTrip ${t.id} does not belong to vessel ${vessel.id}`);
      }
      trip = t;
    }

    const owner = await this.ownerRepo.findOne({
      where: { vesselId: vessel.id, isCurrent: true },
    });
    const captainFromTripCrew = trip
      ? await this.tripCrewRepo.findOne({
          where: { fishingTripId: trip.id, crewRole: 'CAPTAIN' },
        })
      : null;
    const captainFromVesselCrew = await this.vesselCrewRepo.findOne({
      where: { vesselId: vessel.id, crewRole: 'CAPTAIN', isActive: true },
    });

    const def = await this.defRepo.findOne({
      where: { formCode: RegulatoryFormCode.NKKT, isActive: true },
    });
    if (!def) {
      throw new NotFoundException(
        `Active FormDefinition for code ${RegulatoryFormCode.NKKT} not found`,
      );
    }

    // Auto-resolve operations and catches if not explicitly provided
    let operationsSummary = input.operationsSummary;
    if ((!operationsSummary || operationsSummary.length === 0) && trip) {
      const ops = await this.operationRepo.find({
        where: { fishingTripId: trip.id },
        order: { operationStartedAt: 'ASC' },
      });
      const opIds = ops.map((o) => o.id);
      const catches = opIds.length
        ? await this.catchRecordRepo
            .createQueryBuilder('c')
            .where('c.fishing_operation_id IN (:...ids)', { ids: opIds })
            .getMany()
        : [];

      const catchesByOp = new Map<string, CatchRecord[]>();
      for (const c of catches) {
        const list = catchesByOp.get(c.fishingOperationId) || [];
        list.push(c);
        catchesByOp.set(c.fishingOperationId, list);
      }

      operationsSummary = ops.map((op, idx) => {
        const opCatches = catchesByOp.get(op.id) || [];
        return {
          operationNumber: idx + 1,
          operationId: op.id,
          operationStartedAt: op.operationStartedAt,
          operationEndedAt: op.operationEndedAt,
          latitude: op.latitude ? Number(op.latitude) : null,
          longitude: op.longitude ? Number(op.longitude) : null,
          fishingGearType: op.fishingGearType,
          fishingGround: op.fishingGround,
          depth: op.depth ? Number(op.depth) : null,
          catches: opCatches.map((c) => ({
            speciesCode: c.speciesCode,
            speciesName: c.speciesName,
            quantityKg: c.quantity ? Number(c.quantity) : 0,
            unit: c.unit || 'kg',
            condition: c.condition,
          })),
          totalCatchKg: opCatches.reduce(
            (sum, c) => sum + (c.quantity ? Number(c.quantity) : 0),
            0,
          ),
        };
      });
    }

    // Generate standard trip identifier: (ABC-xxxxx-KT-yy-zz)
    const tripNum = trip?.tripNumber || '01';
    const numPadded = String(tripNum).padStart(2, '0');
    const yearDigits = String((trip?.departureAt || new Date()).getFullYear()).slice(-2);
    const generatedIdentifier = `(${vessel.registrationNumber}-KT-${numPadded}-${yearDigits})`;

    const formData = {
      formCode: RegulatoryFormCode.NKKT,
      tripIdentifier: input.tripIdentifier || generatedIdentifier,
      vessel: {
        id: vessel.id,
        registrationNumber: vessel.registrationNumber,
        vesselName: vessel.vesselName,
        vesselType: vessel.vesselType,
        length: vessel.length ? Number(vessel.length) : null,
        enginePower: vessel.enginePower ? Number(vessel.enginePower) : null,
        provinceCode: vessel.provinceCode,
      },
      owner: owner ? { userId: owner.userId, ownershipType: owner.ownershipType } : null,
      captain: captainFromTripCrew || captainFromVesselCrew
        ? { userId: captainFromTripCrew?.userId ?? captainFromVesselCrew?.userId ?? null }
        : null,
      mainOccupation: input.mainOccupation || null,
      subOccupation1: input.subOccupation1 || null,
      subOccupation2: input.subOccupation2 || null,
      gearSpecifications: input.gearSpecifications || null,
      operationsSummary: operationsSummary || [],
      endangeredSpecies: input.endangeredSpecies || [],
      transshipments: input.transshipments || [],
      ports: {
        departurePortCode: trip?.departurePortCode || null,
        departureAt: trip?.departureAt || null,
        arrivalPortCode: trip?.arrivalPortCode || null,
        arrivalAt: trip?.arrivalAt || null,
      },
      logbookNumber: input.logbookNumber || null,
      notes: input.notes || null,
    };

    return this.submissionService.createForm(
      {
        formDefinitionId: def.id,
        vesselId: vessel.id,
        fishingTripId: trip?.id ?? null,
        data: formData,
      },
      user,
    );
  }
}
