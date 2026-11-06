/**
 * PHASE 5 — Fishing Trip Business Service.
 *
 * State-machine transitions:
 *   prepareTrip, departTrip, startFishing, startReturning, completeTrip, cancelTrip
 *
 * PHASE 7 — Domain events.
 *   Every successful business transition records a domain event inside
 *   the same DB transaction. The outbox worker delivers them later.
 *
 * PHASE 8 — User-scoped visibility.
 *   Users can only see fishing trips for vessels they own or are associated with.
 */

import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { FishingTrip } from './fishing-trip.entity';
import { Vessel } from '../vessel/vessel.entity';
import { VesselOwner } from '../vessel-owner/vessel-owner.entity';
import { VesselCrew } from '../vessel-crew/vessel-crew.entity';
import { FishingTripCrew } from '../fishing-trip-crew/fishing-trip-crew.entity';
import { VesselService } from '../vessel/vessel.service';
import { AuthorizationService } from '../auth/authorization.service';
import { SystemRole } from '../constants/enums/system-role.enum';

import { CreateFishingTripDto } from './dto/create-fishing-trip.dto';
import { UpdateFishingTripDto } from './dto/update-fishing-trip.dto';
import { QueryFishingTripDto } from './dto/query-fishing-trip.dto';

import {
  FishingTripStatus,
  FishingTripSubmissionStatus,
} from '../constants/enums/domain.enum';

import {
  assertTripStatusTransition,
  assertVesselCanHostTrip,
  isTerminalTripStatus,
} from '../domain/fishing-trip/fishing-trip-state-machine';
import { Logger } from '../services/logger.service';
import { OutboxService } from '../domain-events/outbox.service';
import {
  DomainEventType,
  DomainEventTypeValue,
} from '../domain-events/domain-event.envelope';
import type { AuthUser } from '../auth/current-user.decorator';

const TRIP_STATE_EVENT: Record<FishingTripStatus, DomainEventTypeValue | null> =
  {
    [FishingTripStatus.DRAFT]: null,
    [FishingTripStatus.PREPARING]: DomainEventType.FishingTripPrepared,
    [FishingTripStatus.DEPARTED]: DomainEventType.FishingTripDeparted,
    [FishingTripStatus.FISHING]: DomainEventType.FishingTripStartedFishing,
    [FishingTripStatus.RETURNING]: DomainEventType.FishingTripReturning,
    [FishingTripStatus.COMPLETED]: DomainEventType.FishingTripCompleted,
    [FishingTripStatus.CANCELLED]: DomainEventType.FishingTripCancelled,
  };

@Injectable()
export class FishingTripService {
  private readonly logger = new Logger('FishingTripService');

  constructor(
    @InjectRepository(FishingTrip)
    private readonly repository: Repository<FishingTrip>,
    @InjectRepository(Vessel)
    private readonly vesselRepo: Repository<Vessel>,
    @InjectRepository(VesselOwner)
    private readonly vesselOwnerRepo: Repository<VesselOwner>,
    @InjectRepository(VesselCrew)
    private readonly vesselCrewRepo: Repository<VesselCrew>,
    @InjectRepository(FishingTripCrew)
    private readonly tripCrewRepo: Repository<FishingTripCrew>,
    private readonly vesselService: VesselService,
    private readonly authService: AuthorizationService,
    private readonly dataSource: DataSource,
    private readonly outboxService: OutboxService,
  ) {}

  /**
   * Find all fishing trips.
   * If user is provided, only returns trips for vessels the user owns or is associated with.
   * SUPER_ADMIN sees all.
   */
  async findAll(
    query: QueryFishingTripDto,
    user?: AuthUser,
  ): Promise<FishingTrip[]> {
    this.logger.log({ event: 'findAll', query, userId: user?.accountId });
    const qb = this.repository
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.vessel', 'vessel');

    // User-scoped filtering
    if (user?.accountId) {
      // SUPER_ADMIN sees all
      if (user.systemRole !== SystemRole.SUPER_ADMIN) {
        const vesselIds = await this.getAccessibleVesselIds(user);
        if (vesselIds.length === 0) {
          return [];
        }
        qb.andWhere('trip.vessel_id IN (:...vesselIds)', { vesselIds });
      }
    }

    if (query.vesselId) {
      // If querying specific vessel, check access
      if (user?.accountId && user.systemRole !== SystemRole.SUPER_ADMIN) {
        const accessible = await this.getAccessibleVesselIds(user);
        if (!accessible.includes(query.vesselId)) {
          return [];
        }
      }
      qb.andWhere('trip.vessel_id = :vesselId', { vesselId: query.vesselId });
    }

    if (query.createdBy) {
      qb.andWhere('trip.created_by = :createdBy', {
        createdBy: query.createdBy,
      });
    }
    if (query.status) {
      qb.andWhere('trip.status = :status', { status: query.status });
    }
    if (query.submissionStatus) {
      qb.andWhere('trip.submission_status = :submissionStatus', {
        submissionStatus: query.submissionStatus,
      });
    }
    if (query.tripNumber) {
      qb.andWhere('trip.trip_number = :tripNumber', {
        tripNumber: query.tripNumber,
      });
    }
    if (query.departureFrom) {
      qb.andWhere('trip.departure_at >= :from', { from: query.departureFrom });
    }
    if (query.departureTo) {
      qb.andWhere('trip.departure_at <= :to', { to: query.departureTo });
    }
    qb.orderBy('trip.created_at', 'DESC');
    qb.offset(((query.page ?? 1) - 1) * (query.limit ?? 20));
    qb.limit(query.limit ?? 20);
    return qb.getMany();
  }

  /**
   * Get vessel IDs that the user has access to.
   * SUPER_ADMIN has no restriction.
   */
  private async getAccessibleVesselIds(user: AuthUser): Promise<string[]> {
    if (!user?.accountId) return [];

    // SUPER_ADMIN sees all
    if (user.systemRole === SystemRole.SUPER_ADMIN) {
      return [];
    }

    // Get vessels where user is owner (via vessels.owner_id)
    const ownedVessels = await this.vesselRepo
      .createQueryBuilder('v')
      .select('v.id', 'vesselId')
      .where('v.owner_id = :accountId', { accountId: user.accountId })
      .getRawMany();

    // Get vessels where user is in vessel_owners
    const vesselOwnerVessels = await this.vesselOwnerRepo
      .createQueryBuilder('vo')
      .select('vo.vessel_id', 'vesselId')
      .where('vo.user_id = :accountId', { accountId: user.accountId })
      .andWhere('vo.is_current = :isCurrent', { isCurrent: true })
      .getRawMany();

    // Get vessels where user is in vessel_crew
    const vesselCrewVessels = await this.vesselCrewRepo
      .createQueryBuilder('vc')
      .select('vc.vessel_id', 'vesselId')
      .where('vc.user_id = :accountId', { accountId: user.accountId })
      .andWhere('vc.is_active = :isActive', { isActive: true })
      .getRawMany();

    const vesselIds = new Set<string>();
    for (const row of ownedVessels) vesselIds.add(row.vesselId);
    for (const row of vesselOwnerVessels) vesselIds.add(row.vesselId);
    for (const row of vesselCrewVessels) vesselIds.add(row.vesselId);

    return Array.from(vesselIds);
  }

  /**
   * Check if user can access a specific trip
   */
  private async canAccessTrip(
    tripId: string,
    user: AuthUser,
  ): Promise<boolean> {
    if (!user?.accountId) return false;

    // SUPER_ADMIN always has access
    if (user.systemRole === SystemRole.SUPER_ADMIN) return true;

    const trip = await this.repository.findOne({
      where: { id: tripId },
      select: ['id', 'vesselId'],
    });

    if (!trip) return false;

    const accessibleVessels = await this.getAccessibleVesselIds(user);
    return accessibleVessels.includes(trip.vesselId);
  }

  async findOne(id: string, user?: AuthUser): Promise<FishingTrip> {
    this.logger.log({ event: 'findOne', id, userId: user?.accountId });
    const trip = await this.repository.findOne({
      where: { id },
      relations: { vessel: true },
    });
    if (!trip) {
      throw new NotFoundException(`FishingTrip ${id} not found`);
    }

    // Check access
    if (user?.accountId) {
      const canAccess = await this.canAccessTrip(id, user);
      if (!canAccess) {
        throw new NotFoundException(`FishingTrip ${id} not found`);
      }
    }

    return trip;
  }

  async create(
    dto: CreateFishingTripDto,
    user: AuthUser,
  ): Promise<FishingTrip> {
    this.logger.log({ event: 'create', dto, by: user.accountId });
    if (!user?.accountId) {
      throw new ForbiddenException('Authenticated user required');
    }

    // Verify vessel exists and user has access
    const vessel = await this.vesselService.findOne(dto.vesselId);

    // Check if user has access to this vessel
    const canAccess = await this.canUserAccessVessel(dto.vesselId, user);
    if (!canAccess) {
      throw new ForbiddenException('You do not have access to this vessel');
    }

    assertVesselCanHostTrip(vessel.status);

    // Vessel-exclusivity rule: a vessel may not have two overlapping
    // non-terminal trips. Reject the create if the vessel is already
    // participating in an active trip (DRAFT/PREPARING/DEPARTED/FISHING/RETURNING).
    await this.assertVesselHasNoActiveTrip(dto.vesselId);

    return this.dataSource.transaction(async (manager) => {
      const newTrip = manager.create(FishingTrip, {
        ...dto,
        vesselId: vessel.id,
        createdBy: user.accountId,
        status: FishingTripStatus.DRAFT,
        submissionStatus: FishingTripSubmissionStatus.NOT_SUBMITTED,
      });
      const saved = await manager.save(newTrip);
      await this.outboxService.record(manager, {
        eventType: DomainEventType.FishingTripCreated,
        aggregateType: 'FishingTrip',
        aggregateId: saved.id,
        actor: { userId: user.accountId },
        payload: {
          fishingTripId: saved.id,
          vesselId: saved.vesselId,
          tripNumber: saved.tripNumber ?? null,
          status: saved.status,
          departurePortCode: saved.departurePortCode ?? null,
          arrivalPortCode: saved.arrivalPortCode ?? null,
          occurredAt: new Date().toISOString(),
        },
      });
      return saved;
    });
  }

  /**
   * Generic update — does NOT allow mutation of protected workflow
   * fields (status, submissionStatus, createdBy).
   */
  async update(
    id: string,
    dto: UpdateFishingTripDto,
    user: AuthUser,
  ): Promise<FishingTrip> {
    this.logger.log({ event: 'update', id, dto, userId: user?.accountId });

    // Check access
    const canAccess = await this.canAccessTrip(id, user);
    if (!canAccess) {
      throw new NotFoundException(`FishingTrip ${id} not found`);
    }

    const trip = await this.findOne(id);
    if (
      (dto as { status?: string }).status !== undefined ||
      (dto as { submissionStatus?: string }).submissionStatus !== undefined ||
      (dto as { createdBy?: string }).createdBy !== undefined
    ) {
      throw new BadRequestException(
        'Use explicit trip transition endpoints to change status / submissionStatus',
      );
    }
    if ((dto as { vesselId?: string }).vesselId) {
      const vessel = await this.vesselService.findOne(
        (dto as { vesselId: string }).vesselId,
      );
      const canAccessNew = await this.canUserAccessVessel(
        (dto as { vesselId: string }).vesselId,
        user,
      );
      if (!canAccessNew) {
        throw new ForbiddenException('You do not have access to this vessel');
      }
      assertVesselCanHostTrip(vessel.status);
      // Only enforce exclusivity if the trip itself is still active and
      // we are actually changing the vessel. Trips that are already terminal
      // can have metadata edits without re-checking.
      if (
        (dto as { vesselId: string }).vesselId !== trip.vesselId &&
        !isTerminalTripStatus(trip.status)
      ) {
        await this.assertVesselHasNoActiveTrip(
          (dto as { vesselId: string }).vesselId,
        );
      }
    }
    Object.assign(trip, dto);
    return this.repository.save(trip);
  }

  async remove(id: string, user: AuthUser): Promise<void> {
    this.logger.log({ event: 'remove', id, userId: user?.accountId });

    // Check access
    const canAccess = await this.canAccessTrip(id, user);
    if (!canAccess) {
      throw new NotFoundException(`FishingTrip ${id} not found`);
    }

    await this.repository.delete(id);
  }

  // ─── State machine transitions ─────────────────────────────────────

  async prepareTrip(id: string, user: AuthUser): Promise<FishingTrip> {
    return this.transition(id, FishingTripStatus.PREPARING, user);
  }

  async departTrip(id: string, user: AuthUser): Promise<FishingTrip> {
    return this.transition(id, FishingTripStatus.DEPARTED, user);
  }

  async startFishing(id: string, user: AuthUser): Promise<FishingTrip> {
    return this.transition(id, FishingTripStatus.FISHING, user);
  }

  async startReturning(id: string, user: AuthUser): Promise<FishingTrip> {
    return this.transition(id, FishingTripStatus.RETURNING, user);
  }

  async completeTrip(id: string, user: AuthUser): Promise<FishingTrip> {
    return this.dataSource.transaction(async (manager) => {
      const trip = await manager.findOne(FishingTrip, { where: { id } });
      if (!trip) {
        throw new NotFoundException(`FishingTrip ${id} not found`);
      }

      // Check access
      const canAccess = await this.canAccessTrip(id, user);
      if (!canAccess) {
        throw new NotFoundException(`FishingTrip ${id} not found`);
      }

      assertTripStatusTransition(trip.status, FishingTripStatus.COMPLETED);
      const previousStatus = trip.status;
      trip.status = FishingTripStatus.COMPLETED;
      const saved = await manager.save(trip);
      this.logger.log({
        event: 'trip.completed',
        tripId: id,
        previousStatus,
        by: user.accountId,
      });
      await this.recordTripEvent(
        manager,
        saved,
        DomainEventType.FishingTripCompleted,
        user.accountId,
        { previousStatus },
      );
      return saved;
    });
  }

  async cancelTrip(id: string, user: AuthUser): Promise<FishingTrip> {
    return this.transition(id, FishingTripStatus.CANCELLED, user);
  }

  private async transition(
    id: string,
    target: FishingTripStatus,
    user: AuthUser,
  ): Promise<FishingTrip> {
    this.logger.log({
      event: 'trip.transition',
      tripId: id,
      target,
      by: user.accountId,
    });

    // Check access
    const canAccess = await this.canAccessTrip(id, user);
    if (!canAccess) {
      throw new NotFoundException(`FishingTrip ${id} not found`);
    }

    return this.dataSource.transaction(async (manager) => {
      const trip = await manager.findOne(FishingTrip, { where: { id } });
      if (!trip) {
        throw new NotFoundException(`FishingTrip ${id} not found`);
      }
      assertTripStatusTransition(trip.status, target);
      const previousStatus = trip.status;
      trip.status = target;
      const saved = await manager.save(trip);
      const eventType = TRIP_STATE_EVENT[target];
      if (eventType) {
        await this.recordTripEvent(manager, saved, eventType, user.accountId, {
          previousStatus,
        });
      }
      return saved;
    });
  }

  private async canUserAccessVessel(
    vesselId: string,
    user: AuthUser,
  ): Promise<boolean> {
    if (!user?.accountId) return false;

    // SUPER_ADMIN always has access
    if (user.systemRole === SystemRole.SUPER_ADMIN) return true;

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

  /**
   * Vessel-exclusivity rule: a vessel may not simultaneously belong to
   * two non-terminal trips. Returns 409 ConflictException with a friendly
   * Vietnamese message if the vessel is currently in an active trip.
   */
  private async assertVesselHasNoActiveTrip(vesselId: string): Promise<void> {
    const active = await this.repository
      .createQueryBuilder('trip')
      .where('trip.vessel_id = :vesselId', { vesselId })
      .andWhere('trip.status NOT IN (:...terminal)', {
        terminal: ['COMPLETED', 'CANCELLED'],
      })
      .getCount();

    if (active > 0) {
      throw new ConflictException(
        'Tàu đang thuộc một chuyến biển khác. Không thể tạo chuyến biển mới cho đến khi chuyến hiện tại kết thúc hoặc bị hủy.',
      );
    }
  }

  private async recordTripEvent(
    manager: import('typeorm').EntityManager,
    trip: FishingTrip,
    eventType: DomainEventTypeValue,
    actorId: string,
    extras: Record<string, unknown>,
  ): Promise<void> {
    await this.outboxService.record(manager, {
      eventType,
      aggregateType: 'FishingTrip',
      aggregateId: trip.id,
      actor: { userId: actorId },
      payload: {
        fishingTripId: trip.id,
        vesselId: trip.vesselId,
        status: trip.status,
        submissionStatus: trip.submissionStatus ?? null,
        tripNumber: trip.tripNumber ?? null,
        departurePortCode: trip.departurePortCode ?? null,
        arrivalPortCode: trip.arrivalPortCode ?? null,
        occurredAt: new Date().toISOString(),
        ...extras,
      },
    });
  }
}
