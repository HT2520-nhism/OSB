/**
 * PHASE 5 — Landing Record Business Service.
 *
 * Rules:
 *  - FishingTrip must exist.
 *  - landedAt must be valid.
 *  - LandingRecord.totalQuantity is calculated as the SUM of child
 *    LandingCatch quantities. Clients cannot override this directly.
 *  - On landing creation we accept an initial set of catches.
 *  - Identity (createdBy) comes from the authenticated user.
 *
 * PHASE 8 — User-scoped visibility.
 *   Users can only see landing records for vessels they own or are associated with.
 */

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { LandingRecord } from './landing-record.entity';
import { LandingCatch } from '../landing-catch/landing-catch.entity';
import { FishingTrip } from '../fishing-trip/fishing-trip.entity';
import { Vessel } from '../vessel/vessel.entity';
import { VesselOwner } from '../vessel-owner/vessel-owner.entity';
import { VesselCrew } from '../vessel-crew/vessel-crew.entity';

import { UpdateLandingRecordDto } from './dto/update-landing-record.dto';
import { AuthUser } from '../auth/current-user.decorator';
import { Logger } from '../services/logger.service';
import { numberToDbString } from '../domain/db-type-conversion';

export interface LandingCatchInput {
  speciesCode?: string;
  speciesName?: string;
  quantity?: number;
  unit?: string;
}

export interface CreateLandingInput {
  fishingTripId: string;
  landingPortCode?: string;
  landedAt?: string;
  notes?: string;
  catches?: LandingCatchInput[];
}

@Injectable()
export class LandingRecordService {
  private readonly logger = new Logger('LandingRecordService');

  constructor(
    @InjectRepository(LandingRecord)
    private readonly repository: Repository<LandingRecord>,
    @InjectRepository(LandingCatch)
    private readonly catchRepo: Repository<LandingCatch>,
    @InjectRepository(FishingTrip)
    private readonly tripRepo: Repository<FishingTrip>,
    @InjectRepository(Vessel)
    private readonly vesselRepo: Repository<Vessel>,
    @InjectRepository(VesselOwner)
    private readonly vesselOwnerRepo: Repository<VesselOwner>,
    @InjectRepository(VesselCrew)
    private readonly vesselCrewRepo: Repository<VesselCrew>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Find all landing records.
   * If user is provided, only returns records for vessels the user owns or is associated with.
   */
  async findAll(user?: AuthUser): Promise<LandingRecord[]> {
    this.logger.log({ event: 'findAll', userId: user?.accountId });

    if (!user?.accountId) {
      // No user context - return empty for security
      return [];
    }

    // Get accessible vessel IDs
    const vesselIds = await this.getAccessibleVesselIds(user.accountId);
    if (vesselIds.length === 0) {
      return [];
    }

    // Get trips for those vessels
    const trips = await this.tripRepo
      .createQueryBuilder('ft')
      .select('ft.id', 'tripId')
      .where('ft.vessel_id IN (:...vesselIds)', { vesselIds })
      .getRawMany();

    const tripIds = trips.map((t) => t.tripId);
    if (tripIds.length === 0) {
      return [];
    }

    return this.repository
      .createQueryBuilder('lr')
      .where('lr.fishing_trip_id IN (:...tripIds)', { tripIds })
      .orderBy('lr.created_at', 'DESC')
      .getMany();
  }

  /**
   * Get vessel IDs that the user has access to
   */
  private async getAccessibleVesselIds(userId: string): Promise<string[]> {
    // Get vessels where user is owner (via vessels.owner_id)
    const ownedVessels = await this.vesselRepo
      .createQueryBuilder('v')
      .select('v.id', 'vesselId')
      .where('v.owner_id = :userId', { userId })
      .getRawMany();

    // Get vessels where user is in vessel_owners
    const vesselOwnerVessels = await this.vesselOwnerRepo
      .createQueryBuilder('vo')
      .select('vo.vessel_id', 'vesselId')
      .where('vo.user_id = :userId', { userId })
      .andWhere('vo.is_current = :isCurrent', { isCurrent: true })
      .getRawMany();

    // Get vessels where user is in vessel_crew
    const vesselCrewVessels = await this.vesselCrewRepo
      .createQueryBuilder('vc')
      .select('vc.vessel_id', 'vesselId')
      .where('vc.user_id = :userId', { userId })
      .andWhere('vc.is_active = :isActive', { isActive: true })
      .getRawMany();

    // Combine and deduplicate
    const vesselIds = new Set<string>();
    for (const row of ownedVessels) vesselIds.add(row.vesselId);
    for (const row of vesselOwnerVessels) vesselIds.add(row.vesselId);
    for (const row of vesselCrewVessels) vesselIds.add(row.vesselId);

    return Array.from(vesselIds);
  }

  /**
   * Check if user can access a landing record
   */
  private async canAccessLandingRecord(
    recordId: string,
    user: AuthUser,
  ): Promise<boolean> {
    if (!user?.accountId) return false;

    const record = await this.repository.findOne({
      where: { id: recordId },
      select: ['id', 'fishingTripId'],
    });

    if (!record) return false;

    const trip = await this.tripRepo.findOne({
      where: { id: record.fishingTripId },
      select: ['id', 'vesselId'],
    });

    if (!trip) return false;

    const accessibleVessels = await this.getAccessibleVesselIds(user.accountId);
    return accessibleVessels.includes(trip.vesselId);
  }

  async findOne(id: string, user?: AuthUser): Promise<LandingRecord> {
    this.logger.log({ event: 'findOne', id, userId: user?.accountId });
    const e = await this.repository.findOne({ where: { id } });
    if (!e) {
      throw new NotFoundException(`LandingRecord ${id} not found`);
    }

    // Check access
    if (user?.accountId) {
      const canAccess = await this.canAccessLandingRecord(id, user);
      if (!canAccess) {
        throw new NotFoundException(`LandingRecord ${id} not found`);
      }
    }

    return e;
  }

  /**
   * Create a landing with its initial catches in a single transaction.
   * totalQuantity is computed from the sum of children.
   */
  async createLanding(
    input: CreateLandingInput,
    user: AuthUser,
  ): Promise<LandingRecord> {
    this.logger.log({ event: 'landing.create', input, by: user.accountId });
    if (!user?.accountId) {
      throw new ForbiddenException('Authenticated user required');
    }
    if (!input.fishingTripId) {
      throw new BadRequestException('fishingTripId is required');
    }

    // Check user has access to this trip
    const canAccess = await this.canUserAccessTrip(input.fishingTripId, user);
    if (!canAccess) {
      throw new ForbiddenException(
        'You do not have access to this fishing trip',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const trip = await manager.findOne(FishingTrip, {
        where: { id: input.fishingTripId },
      });
      if (!trip) {
        throw new NotFoundException(
          `FishingTrip ${input.fishingTripId} not found`,
        );
      }
      const total = (input.catches ?? []).reduce(
        (sum, c) => sum + this.parseQuantity(c.quantity),
        0,
      );

      const landing = manager.create(LandingRecord, {
        fishingTripId: input.fishingTripId,
        landingPortCode: input.landingPortCode ?? null,
        landedAt: input.landedAt ? new Date(input.landedAt) : null,
        totalQuantity: total.toFixed(3),
        notes: input.notes ?? null,
        createdBy: user.accountId,
      });
      const savedLanding = await manager.save(landing);

      if (input.catches && input.catches.length > 0) {
        for (const c of input.catches) {
          this.assertNonNegative(c.quantity, 'catch.quantity');
          const catchEntity = manager.create(LandingCatch, {
            landingRecordId: savedLanding.id,
            speciesCode: c.speciesCode ?? null,
            speciesName: c.speciesName ?? null,
            quantity: numberToDbString(c.quantity),
            unit: c.unit ?? null,
          });
          await manager.save(catchEntity);
        }
      }
      return savedLanding;
    });
  }

  /**
   * Check if user can access a fishing trip
   */
  private async canUserAccessTrip(
    tripId: string,
    user: AuthUser,
  ): Promise<boolean> {
    if (!user?.accountId) return false;

    const trip = await this.tripRepo.findOne({
      where: { id: tripId },
      select: ['id', 'vesselId'],
    });

    if (!trip) return false;

    const accessibleVessels = await this.getAccessibleVesselIds(user.accountId);
    return accessibleVessels.includes(trip.vesselId);
  }

  /**
   * Adds a new LandingCatch to an existing LandingRecord and recomputes total.
   */
  async addCatch(
    landingRecordId: string,
    catchInput: LandingCatchInput,
    user?: AuthUser,
  ): Promise<LandingRecord> {
    // Check access
    if (user?.accountId) {
      const canAccess = await this.canAccessLandingRecord(
        landingRecordId,
        user,
      );
      if (!canAccess) {
        throw new NotFoundException(
          `LandingRecord ${landingRecordId} not found`,
        );
      }
    }

    return this.dataSource.transaction(async (manager) => {
      const landing = await manager.findOne(LandingRecord, {
        where: { id: landingRecordId },
      });
      if (!landing) {
        throw new NotFoundException(
          `LandingRecord ${landingRecordId} not found`,
        );
      }
      this.assertNonNegative(catchInput.quantity, 'catch.quantity');

      const catchEntity = manager.create(LandingCatch, {
        landingRecordId: landing.id,
        speciesCode: catchInput.speciesCode ?? null,
        speciesName: catchInput.speciesName ?? null,
        quantity: numberToDbString(catchInput.quantity),
        unit: catchInput.unit ?? null,
      });
      await manager.save(catchEntity);

      const catches = await manager.find(LandingCatch, {
        where: { landingRecordId: landing.id },
      });
      const newTotal = catches.reduce(
        (sum, c) => sum + this.parseQuantity(c.quantity),
        0,
      );
      landing.totalQuantity = newTotal.toFixed(3);
      await manager.save(landing);
      return landing;
    });
  }

  async create(data: {
    fishingTripId: string;
    landingPortCode?: string | null;
    landedAt?: string | null;
    totalQuantity?: string | null;
    notes?: string | null;
    createdBy?: string;
  }): Promise<LandingRecord> {
    return this.dataSource.transaction(async (manager) => {
      const trip = await manager.findOne(FishingTrip, {
        where: { id: data.fishingTripId },
      });
      if (!trip) {
        throw new NotFoundException(
          `FishingTrip ${data.fishingTripId} not found`,
        );
      }
      const entity = manager.create(LandingRecord, {
        ...data,
        totalQuantity: data.totalQuantity ?? '0.000',
      });
      return manager.save(entity);
    });
  }

  async update(
    id: string,
    data:
      | Partial<LandingRecord>
      | Record<string, unknown>
      | UpdateLandingRecordDto,
    user?: AuthUser,
  ): Promise<LandingRecord> {
    // Check access
    if (user?.accountId) {
      const canAccess = await this.canAccessLandingRecord(id, user);
      if (!canAccess) {
        throw new NotFoundException(`LandingRecord ${id} not found`);
      }
    }

    const entity = await this.findOne(id);
    // Disallow direct totalQuantity manipulation — it is derived.
    if ((data as { totalQuantity?: unknown }).totalQuantity !== undefined) {
      throw new BadRequestException(
        'totalQuantity is derived from LandingCatch rows; modify catches instead',
      );
    }
    const safeData: Record<string, unknown> = {
      ...(data as Record<string, unknown>),
    };
    if (
      safeData.landedAt !== undefined &&
      safeData.landedAt !== null &&
      typeof safeData.landedAt === 'string'
    ) {
      safeData.landedAt = new Date(safeData.landedAt as string);
    }
    Object.assign(entity, safeData);
    return this.repository.save(entity);
  }

  async remove(id: string, user?: AuthUser): Promise<void> {
    // Check access
    if (user?.accountId) {
      const canAccess = await this.canAccessLandingRecord(id, user);
      if (!canAccess) {
        throw new NotFoundException(`LandingRecord ${id} not found`);
      }
    }
    await this.findOne(id);
    await this.repository.delete(id);
  }

  private parseQuantity(value: number | string | null | undefined): number {
    if (value === null || value === undefined) return 0;
    const n = typeof value === 'string' ? Number(value) : value;
    if (!Number.isFinite(n)) {
      throw new BadRequestException(`Invalid quantity: ${value}`);
    }
    return n;
  }

  private assertNonNegative(
    value: number | string | null | undefined,
    field: string,
  ): void {
    const n = this.parseQuantity(value);
    if (n < 0) {
      throw new BadRequestException(`${field} must not be negative`);
    }
  }
}
