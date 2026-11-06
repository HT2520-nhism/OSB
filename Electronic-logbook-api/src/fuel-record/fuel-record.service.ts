/**
 * PHASE 5 — Fuel Record Business Service.
 *
 * Rules:
 *  - FishingTrip must exist.
 *  - recordType must be one of the allowed enums.
 *  - quantity must not be negative.
 *  - Identity (createdBy) comes from authenticated user.
 *
 * PHASE 8 — User-scoped visibility.
 *   Users can only see fuel records for vessels they own or are associated with.
 */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FuelRecord } from './fuel-record.entity';
import { FishingTrip } from '../fishing-trip/fishing-trip.entity';
import { Vessel } from '../vessel/vessel.entity';
import { VesselOwner } from '../vessel-owner/vessel-owner.entity';
import { VesselCrew } from '../vessel-crew/vessel-crew.entity';

import { CreateFuelRecordDto } from './dto/create-fuel-record.dto';
import { UpdateFuelRecordDto } from './dto/update-fuel-record.dto';
import { FuelRecordType } from '../constants/enums/domain.enum';
import { AuthUser } from '../auth/current-user.decorator';
import { Logger } from '../services/logger.service';
import { numberToDbString } from '../domain/db-type-conversion';

@Injectable()
export class FuelRecordService {
  private readonly logger = new Logger('FuelRecordService');

  constructor(
    @InjectRepository(FuelRecord)
    private readonly repository: Repository<FuelRecord>,
    @InjectRepository(FishingTrip)
    private readonly tripRepo: Repository<FishingTrip>,
    @InjectRepository(Vessel)
    private readonly vesselRepo: Repository<Vessel>,
    @InjectRepository(VesselOwner)
    private readonly vesselOwnerRepo: Repository<VesselOwner>,
    @InjectRepository(VesselCrew)
    private readonly vesselCrewRepo: Repository<VesselCrew>,
  ) {}

  /**
   * Find all fuel records.
   * If user is provided, only returns records for vessels the user owns or is associated with.
   */
  async findAll(user?: AuthUser): Promise<FuelRecord[]> {
    this.logger.log({ event: 'findAll', userId: user?.accountId });

    if (!user?.accountId) {
      return [];
    }

    const vesselIds = await this.getAccessibleVesselIds(user.accountId);
    if (vesselIds.length === 0) {
      return [];
    }

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
      .createQueryBuilder('fr')
      .where('fr.fishing_trip_id IN (:...tripIds)', { tripIds })
      .orderBy('fr.created_at', 'DESC')
      .getMany();
  }

  private async getAccessibleVesselIds(userId: string): Promise<string[]> {
    const ownedVessels = await this.vesselRepo
      .createQueryBuilder('v')
      .select('v.id', 'vesselId')
      .where('v.owner_id = :userId', { userId })
      .getRawMany();

    const vesselOwnerVessels = await this.vesselOwnerRepo
      .createQueryBuilder('vo')
      .select('vo.vessel_id', 'vesselId')
      .where('vo.user_id = :userId', { userId })
      .andWhere('vo.is_current = :isCurrent', { isCurrent: true })
      .getRawMany();

    const vesselCrewVessels = await this.vesselCrewRepo
      .createQueryBuilder('vc')
      .select('vc.vessel_id', 'vesselId')
      .where('vc.user_id = :userId', { userId })
      .andWhere('vc.is_active = :isActive', { isActive: true })
      .getRawMany();

    const vesselIds = new Set<string>();
    for (const row of ownedVessels) vesselIds.add(row.vesselId);
    for (const row of vesselOwnerVessels) vesselIds.add(row.vesselId);
    for (const row of vesselCrewVessels) vesselIds.add(row.vesselId);

    return Array.from(vesselIds);
  }

  private async canAccessFuelRecord(
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

  async findOne(id: string, user?: AuthUser): Promise<FuelRecord> {
    this.logger.log({ event: 'findOne', id, userId: user?.accountId });
    const e = await this.repository.findOne({ where: { id } });
    if (!e) {
      throw new NotFoundException(`FuelRecord ${id} not found`);
    }

    if (user?.accountId) {
      const canAccess = await this.canAccessFuelRecord(id, user);
      if (!canAccess) {
        throw new NotFoundException(`FuelRecord ${id} not found`);
      }
    }

    return e;
  }

  async create(dto: CreateFuelRecordDto, user: AuthUser): Promise<FuelRecord> {
    this.logger.log({ event: 'fuel.create', dto, by: user.accountId });
    if (!user?.accountId) {
      throw new ForbiddenException('Authenticated user required');
    }

    const canAccess = await this.canUserAccessTrip(dto.fishingTripId, user);
    if (!canAccess) {
      throw new ForbiddenException(
        'You do not have access to this fishing trip',
      );
    }

    const trip = await this.tripRepo.findOne({
      where: { id: dto.fishingTripId },
    });
    if (!trip) {
      throw new NotFoundException(`FishingTrip ${dto.fishingTripId} not found`);
    }

    if (
      dto.recordType &&
      !Object.values(FuelRecordType).includes(dto.recordType as FuelRecordType)
    ) {
      throw new BadRequestException(
        `Invalid recordType: ${dto.recordType}. Allowed: ${Object.values(
          FuelRecordType,
        ).join(', ')}`,
      );
    }
    this.assertNonNegative(dto.quantity, 'quantity');

    const entity = this.repository.create({
      fishingTripId: dto.fishingTripId,
      recordType: dto.recordType ?? null,
      quantity: numberToDbString(dto.quantity),
      unit: dto.unit ?? null,
      occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : null,
      location: dto.location ?? null,
      notes: dto.notes ?? null,
      createdBy: user.accountId,
    });
    return this.repository.save(entity);
  }

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

  async update(
    id: string,
    dto: UpdateFuelRecordDto,
    user?: AuthUser,
  ): Promise<FuelRecord> {
    if (user?.accountId) {
      const canAccess = await this.canAccessFuelRecord(id, user);
      if (!canAccess) {
        throw new NotFoundException(`FuelRecord ${id} not found`);
      }
    }

    const entity = await this.findOne(id);
    if (
      dto.recordType &&
      !Object.values(FuelRecordType).includes(dto.recordType as FuelRecordType)
    ) {
      throw new BadRequestException(
        `Invalid recordType: ${dto.recordType}. Allowed: ${Object.values(
          FuelRecordType,
        ).join(', ')}`,
      );
    }
    if (dto.quantity !== undefined) {
      this.assertNonNegative(dto.quantity, 'quantity');
    }

    Object.assign(entity, {
      recordType: dto.recordType ?? entity.recordType,
      quantity:
        dto.quantity !== undefined
          ? numberToDbString(dto.quantity)
          : entity.quantity,
      unit: dto.unit ?? entity.unit,
      occurredAt:
        dto.occurredAt !== undefined
          ? dto.occurredAt
            ? new Date(dto.occurredAt)
            : null
          : entity.occurredAt,
      location: dto.location ?? entity.location,
      notes: dto.notes ?? entity.notes,
    });
    return this.repository.save(entity);
  }

  async remove(id: string, user?: AuthUser): Promise<void> {
    if (user?.accountId) {
      const canAccess = await this.canAccessFuelRecord(id, user);
      if (!canAccess) {
        throw new NotFoundException(`FuelRecord ${id} not found`);
      }
    }
    await this.findOne(id);
    await this.repository.delete(id);
  }

  private assertNonNegative(
    value: number | string | null | undefined,
    field: string,
  ): void {
    if (value === null || value === undefined) return;
    const n = typeof value === 'string' ? Number(value) : value;
    if (!Number.isFinite(n)) {
      throw new BadRequestException(`${field} must be numeric`);
    }
    if (n < 0) {
      throw new BadRequestException(`${field} must not be negative`);
    }
  }
}
