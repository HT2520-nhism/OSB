/**
 * PHASE 5 — Port Call Business Service.
 *
 * Rules:
 *  - FishingTrip must exist.
 *  - callType must be one of DEPARTURE / ARRIVAL / TRANSIT / EMERGENCY.
 *  - Identity (createdBy) comes from authenticated user.
 *
 * PHASE 8 — User-scoped visibility.
 *   Users can only see port calls for vessels they own or are associated with.
 */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PortCall } from './port-call.entity';
import { FishingTrip } from '../fishing-trip/fishing-trip.entity';
import { Vessel } from '../vessel/vessel.entity';
import { VesselOwner } from '../vessel-owner/vessel-owner.entity';
import { VesselCrew } from '../vessel-crew/vessel-crew.entity';

import { CreatePortCallDto } from './dto/create-port-call.dto';
import { UpdatePortCallDto } from './dto/update-port-call.dto';

import { PortCallType } from '../constants/enums/domain.enum';
import { AuthUser } from '../auth/current-user.decorator';
import { Logger } from '../services/logger.service';
import { coordinateToDbString } from '../domain/db-type-conversion';

@Injectable()
export class PortCallService {
  private readonly logger = new Logger('PortCallService');

  constructor(
    @InjectRepository(PortCall)
    private readonly repository: Repository<PortCall>,
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
   * Find all port calls.
   * If user is provided, only returns records for vessels the user owns or is associated with.
   */
  async findAll(user?: AuthUser): Promise<PortCall[]> {
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
      .createQueryBuilder('pc')
      .where('pc.fishing_trip_id IN (:...tripIds)', { tripIds })
      .orderBy('pc.created_at', 'DESC')
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

  private async canAccessPortCall(
    portCallId: string,
    user: AuthUser,
  ): Promise<boolean> {
    if (!user?.accountId) return false;

    const portCall = await this.repository.findOne({
      where: { id: portCallId },
      select: ['id', 'fishingTripId'],
    });

    if (!portCall) return false;

    const trip = await this.tripRepo.findOne({
      where: { id: portCall.fishingTripId },
      select: ['id', 'vesselId'],
    });

    if (!trip) return false;

    const accessibleVessels = await this.getAccessibleVesselIds(user.accountId);
    return accessibleVessels.includes(trip.vesselId);
  }

  async findOne(id: string, user?: AuthUser): Promise<PortCall> {
    this.logger.log({ event: 'findOne', id, userId: user?.accountId });
    const e = await this.repository.findOne({ where: { id } });
    if (!e) {
      throw new NotFoundException(`PortCall ${id} not found`);
    }

    if (user?.accountId) {
      const canAccess = await this.canAccessPortCall(id, user);
      if (!canAccess) {
        throw new NotFoundException(`PortCall ${id} not found`);
      }
    }

    return e;
  }

  async create(dto: CreatePortCallDto, user: AuthUser): Promise<PortCall> {
    this.logger.log({ event: 'port-call.create', dto, by: user.accountId });
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
      dto.callType &&
      !Object.values(PortCallType).includes(dto.callType as PortCallType)
    ) {
      throw new BadRequestException(
        `Invalid callType: ${dto.callType}. Allowed: ${Object.values(
          PortCallType,
        ).join(', ')}`,
      );
    }

    const entity = this.repository.create({
      fishingTripId: dto.fishingTripId,
      portCode: dto.portCode ?? null,
      callType: dto.callType ?? null,
      occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : null,
      latitude: coordinateToDbString(dto.latitude),
      longitude: coordinateToDbString(dto.longitude),
      reason: dto.reason ?? null,
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
    dto: UpdatePortCallDto,
    user?: AuthUser,
  ): Promise<PortCall> {
    if (user?.accountId) {
      const canAccess = await this.canAccessPortCall(id, user);
      if (!canAccess) {
        throw new NotFoundException(`PortCall ${id} not found`);
      }
    }

    const entity = await this.findOne(id);
    if (
      dto.callType &&
      !Object.values(PortCallType).includes(dto.callType as PortCallType)
    ) {
      throw new BadRequestException(
        `Invalid callType: ${dto.callType}. Allowed: ${Object.values(
          PortCallType,
        ).join(', ')}`,
      );
    }
    Object.assign(entity, {
      portCode: dto.portCode ?? entity.portCode,
      callType: dto.callType ?? entity.callType,
      occurredAt:
        dto.occurredAt !== undefined
          ? dto.occurredAt
            ? new Date(dto.occurredAt)
            : null
          : entity.occurredAt,
      latitude:
        dto.latitude !== undefined
          ? coordinateToDbString(dto.latitude)
          : entity.latitude,
      longitude:
        dto.longitude !== undefined
          ? coordinateToDbString(dto.longitude)
          : entity.longitude,
      reason: dto.reason ?? entity.reason,
      notes: dto.notes ?? entity.notes,
    });
    return this.repository.save(entity);
  }

  async remove(id: string, user?: AuthUser): Promise<void> {
    if (user?.accountId) {
      const canAccess = await this.canAccessPortCall(id, user);
      if (!canAccess) {
        throw new NotFoundException(`PortCall ${id} not found`);
      }
    }
    await this.findOne(id);
    await this.repository.delete(id);
  }
}
