/**
 * PHASE 5 — Incident Business Service.
 *
 * Rules:
 *  - Vessel must exist.
 *  - FishingTrip (if supplied) must exist.
 *  - Identity (reportedBy) comes from authenticated user.
 *
 * PHASE 8 — User-scoped visibility.
 *   Users can only see incidents for vessels they own or are associated with.
 */
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Incident } from './incident.entity';
import { Vessel } from '../vessel/vessel.entity';
import { VesselOwner } from '../vessel-owner/vessel-owner.entity';
import { VesselCrew } from '../vessel-crew/vessel-crew.entity';
import { FishingTrip } from '../fishing-trip/fishing-trip.entity';

import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';

import { AuthUser } from '../auth/current-user.decorator';
import { Logger } from '../services/logger.service';
import { coordinateToDbString } from '../domain/db-type-conversion';

@Injectable()
export class IncidentService {
  private readonly logger = new Logger('IncidentService');

  constructor(
    @InjectRepository(Incident)
    private readonly repository: Repository<Incident>,
    @InjectRepository(Vessel)
    private readonly vesselRepo: Repository<Vessel>,
    @InjectRepository(VesselOwner)
    private readonly vesselOwnerRepo: Repository<VesselOwner>,
    @InjectRepository(VesselCrew)
    private readonly vesselCrewRepo: Repository<VesselCrew>,
    @InjectRepository(FishingTrip)
    private readonly tripRepo: Repository<FishingTrip>,
  ) {}

  /**
   * Find all incidents.
   * If user is provided, only returns incidents for vessels the user owns or is associated with.
   */
  async findAll(user?: AuthUser): Promise<Incident[]> {
    this.logger.log({ event: 'findAll', userId: user?.accountId });

    if (!user?.accountId) {
      return [];
    }

    const vesselIds = await this.getAccessibleVesselIds(user.accountId);

    // Query: incidents where user is owner OR incident's vessel is accessible
    const qb = this.repository.createQueryBuilder('i');

    // OR condition: ownerId matches OR vessel is accessible
    qb.where(`(i.owner_id = :userId OR i.vessel_id IN (:...vesselIds))`, {
      userId: user.accountId,
      vesselIds: vesselIds.length > 0 ? vesselIds : [''],
    });

    qb.orderBy('i.created_at', 'DESC');
    return qb.getMany();
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

  private async canAccessIncident(
    incidentId: string,
    user: AuthUser,
  ): Promise<boolean> {
    if (!user?.accountId) return false;

    const incident = await this.repository.findOne({
      where: { id: incidentId },
      select: ['id', 'vesselId', 'ownerId'],
    });

    if (!incident) return false;

    // Check direct ownership
    if (incident.ownerId === user.accountId) return true;

    // Check vessel access
    const accessibleVessels = await this.getAccessibleVesselIds(user.accountId);
    return accessibleVessels.includes(incident.vesselId);
  }

  async findOne(id: string, user?: AuthUser): Promise<Incident> {
    this.logger.log({ event: 'findOne', id, userId: user?.accountId });
    const e = await this.repository.findOne({ where: { id } });
    if (!e) {
      throw new NotFoundException(`Incident ${id} not found`);
    }

    if (user?.accountId) {
      const canAccess = await this.canAccessIncident(id, user);
      if (!canAccess) {
        throw new NotFoundException(`Incident ${id} not found`);
      }
    }

    return e;
  }

  async create(dto: CreateIncidentDto, user: AuthUser): Promise<Incident> {
    this.logger.log({ event: 'incident.create', dto, by: user.accountId });
    if (!user?.accountId) {
      throw new ForbiddenException('Authenticated user required');
    }

    // Check user has access to this vessel
    const canAccess = await this.canUserAccessVessel(dto.vesselId, user);
    if (!canAccess) {
      throw new ForbiddenException('You do not have access to this vessel');
    }

    const vessel = await this.vesselRepo.findOne({
      where: { id: dto.vesselId },
    });
    if (!vessel) {
      throw new NotFoundException(`Vessel ${dto.vesselId} not found`);
    }

    if (dto.fishingTripId) {
      const trip = await this.tripRepo.findOne({
        where: { id: dto.fishingTripId },
      });
      if (!trip) {
        throw new NotFoundException(
          `FishingTrip ${dto.fishingTripId} not found`,
        );
      }
      if (trip.vesselId !== vessel.id) {
        throw new NotFoundException(
          `FishingTrip ${trip.id} does not belong to vessel ${vessel.id}`,
        );
      }
    }

    const entity = this.repository.create({
      fishingTripId: dto.fishingTripId ?? null,
      vesselId: dto.vesselId,
      incidentType: dto.incidentType ?? null,
      severity: dto.severity ?? null,
      occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : null,
      latitude: coordinateToDbString(dto.latitude),
      longitude: coordinateToDbString(dto.longitude),
      description: dto.description ?? null,
      actionTaken: dto.actionTaken ?? null,
      reportedBy: user.accountId,
      ownerId: user.accountId, // Set ownerId to current user
    });
    return this.repository.save(entity);
  }

  private async canUserAccessVessel(
    vesselId: string,
    user: AuthUser,
  ): Promise<boolean> {
    if (!user?.accountId) return false;

    const vessel = await this.vesselRepo.findOne({
      where: { id: vesselId },
      select: ['id', 'ownerId'],
    });

    if (!vessel) return false;

    // Check direct ownership
    if (vessel.ownerId === user.accountId) return true;

    // Check vessel_owners
    const owner = await this.vesselOwnerRepo.findOne({
      where: { vesselId, userId: user.accountId, isCurrent: true },
    });
    if (owner) return true;

    // Check vessel_crew
    const crew = await this.vesselCrewRepo.findOne({
      where: { vesselId, userId: user.accountId, isActive: true },
    });
    if (crew) return true;

    return false;
  }

  async update(
    id: string,
    dto: UpdateIncidentDto,
    user?: AuthUser,
  ): Promise<Incident> {
    if (user?.accountId) {
      const canAccess = await this.canAccessIncident(id, user);
      if (!canAccess) {
        throw new NotFoundException(`Incident ${id} not found`);
      }
    }

    const entity = await this.findOne(id);
    Object.assign(entity, {
      fishingTripId:
        dto.fishingTripId !== undefined
          ? dto.fishingTripId
          : entity.fishingTripId,
      incidentType: dto.incidentType ?? entity.incidentType,
      severity: dto.severity ?? entity.severity,
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
      description: dto.description ?? entity.description,
      actionTaken: dto.actionTaken ?? entity.actionTaken,
    });
    return this.repository.save(entity);
  }

  async remove(id: string, user?: AuthUser): Promise<void> {
    if (user?.accountId) {
      const canAccess = await this.canAccessIncident(id, user);
      if (!canAccess) {
        throw new NotFoundException(`Incident ${id} not found`);
      }
    }
    await this.findOne(id);
    await this.repository.delete(id);
  }
}
