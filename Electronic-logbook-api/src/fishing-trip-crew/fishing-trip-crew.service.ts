/**
 * PHASE 5 — Fishing Trip Crew Business Service.
 *
 * PHASE 8 — Authorization:
 *   All mutation methods require user authentication.
 *   User must have access to the trip's vessel.
 *
 * Rules:
 *  - Fishing Trip must exist.
 *  - No duplicate crew for the same user in the same trip.
 *  - Preserve crew role.
 *  - Respect joinedAt / leftAt consistency.
 */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FishingTripCrew } from './fishing-trip-crew.entity';
import { FishingTrip } from '../fishing-trip/fishing-trip.entity';
import { FishingOperationProfileService } from '../fishing-operation-profile/fishing-operation-profile.service';

import { CreateFishingTripCrewDto } from './dto/create-fishing-trip-crew.dto';
import { UpdateFishingTripCrewDto } from './dto/update-fishing-trip-crew.dto';

import { Logger } from '../services/logger.service';
import { CrewRole } from '../constants/enums/domain.enum';
import type { AuthUser } from '../auth/current-user.decorator';
import { AuthorizationService } from '../auth/authorization.service';

@Injectable()
export class FishingTripCrewService {
  private readonly logger = new Logger('FishingTripCrewService');

  constructor(
    @InjectRepository(FishingTripCrew)
    private readonly repository: Repository<FishingTripCrew>,
    @InjectRepository(FishingTrip)
    private readonly tripRepo: Repository<FishingTrip>,
    private readonly profileService: FishingOperationProfileService,
    private readonly authService: AuthorizationService,
  ) {}

  async findAll(): Promise<FishingTripCrew[]> {
    return this.repository.find();
  }

  async findOne(id: string): Promise<FishingTripCrew> {
    const e = await this.repository.findOne({ where: { id } });
    if (!e) throw new NotFoundException(`FishingTripCrew ${id} not found`);
    return e;
  }

  private async resolveUserId(dto: CreateFishingTripCrewDto): Promise<string> {
    if (dto.userId) {
      return dto.userId;
    }

    if (dto.fishermanCode) {
      const resolved = await this.profileService.resolveUserIdByCode(
        dto.fishermanCode,
      );

      if (!resolved) {
        throw new NotFoundException(
          `Fisherman with code ${dto.fishermanCode} not found`,
        );
      }

      if (resolved.status === 'INACTIVE') {
        throw new BadRequestException(
          `Fisherman with code ${dto.fishermanCode} is inactive`,
        );
      }

      this.logger.log({
        event: 'resolved.fishermanCode',
        fishermanCode: dto.fishermanCode,
        userId: resolved.userId,
      });

      return resolved.userId;
    }

    throw new BadRequestException(
      'Either userId or fishermanCode must be provided',
    );
  }

  async create(
    dto: CreateFishingTripCrewDto,
    user: AuthUser,
  ): Promise<FishingTripCrew> {
    this.logger.log({ event: 'crew.create', dto, userId: user.accountId });
    if (!user?.accountId) {
      throw new ForbiddenException('Authenticated user required');
    }

    const trip = await this.tripRepo.findOne({
      where: { id: dto.fishingTripId },
      select: ['id', 'vesselId'],
    });
    if (!trip) {
      throw new NotFoundException(`FishingTrip ${dto.fishingTripId} not found`);
    }

    // Check user can access this trip (via vessel)
    if (!this.authService.isSuperAdmin(user)) {
      await this.authService.assertCanAccessTrip(dto.fishingTripId, user);
    }

    this.assertDateRange(dto.joinedAt ?? null, dto.leftAt ?? null);

    const resolvedUserId = await this.resolveUserId(dto);

    // Duplicate crew check
    const existing = await this.repository.findOne({
      where: {
        fishingTripId: dto.fishingTripId,
        userId: resolvedUserId,
      },
    });
    if (existing) {
      throw new ConflictException(
        `User ${resolvedUserId} is already a crew member of fishing trip ${dto.fishingTripId}`,
      );
    }

    // Crew-exclusivity rule: a user must not simultaneously belong to
    // two non-terminal trips. Reject with a friendly Vietnamese message
    // if the user is already a crew member of an active trip on any vessel.
    await this.assertUserHasNoActiveTrip(resolvedUserId, dto.fishingTripId);

    const entity = this.repository.create({
      fishingTripId: dto.fishingTripId,
      userId: resolvedUserId,
      crewRole: dto.crewRole ?? CrewRole.CREW,
      joinedAt: dto.joinedAt ? new Date(dto.joinedAt) : null,
      leftAt: dto.leftAt ? new Date(dto.leftAt) : null,
    });
    return this.repository.save(entity);
  }

  async update(
    id: string,
    dto: UpdateFishingTripCrewDto,
    user: AuthUser,
  ): Promise<FishingTripCrew> {
    this.logger.log({ event: 'crew.update', id, dto, userId: user.accountId });
    const entity = await this.findOne(id);

    // Check user can access this trip
    if (!this.authService.isSuperAdmin(user)) {
      await this.authService.assertCanAccessTrip(entity.fishingTripId, user);
    }

    this.assertDateRange(
      dto.joinedAt ?? entity.joinedAt?.toISOString() ?? null,
      dto.leftAt ?? entity.leftAt?.toISOString() ?? null,
    );
    Object.assign(entity, dto);
    return this.repository.save(entity);
  }

  async remove(id: string, user?: AuthUser): Promise<void> {
    this.logger.log({ event: 'crew.remove', id, userId: user?.accountId });
    const entity = await this.findOne(id);

    if (user && !this.authService.isSuperAdmin(user)) {
      await this.authService.assertCanAccessTrip(entity.fishingTripId, user);
    }

    await this.repository.delete(id);
  }

  private assertDateRange(
    joinedAt: string | null,
    leftAt: string | null,
  ): void {
    if (!joinedAt || !leftAt) return;
    const j = new Date(joinedAt);
    const l = new Date(leftAt);
    if (Number.isNaN(j.getTime()) || Number.isNaN(l.getTime())) return;
    if (l.getTime() < j.getTime()) {
      throw new BadRequestException(
        `leftAt (${leftAt}) cannot be before joinedAt (${joinedAt})`,
      );
    }
  }

  /**
   * Crew-exclusivity rule: a user must not simultaneously belong to two
   * non-terminal trips. Returns 409 ConflictException if the user already
   * appears as crew on an active trip other than `excludeTripId`.
   */
  private async assertUserHasNoActiveTrip(
    userId: string,
    excludeTripId: string,
  ): Promise<void> {
    const conflict = await this.tripRepo
      .createQueryBuilder('t')
      .innerJoin(
        'fishing_trip_crews',
        'tc',
        'tc.fishing_trip_id = t.id AND tc.user_id = :userId',
        { userId },
      )
      .where('t.id <> :excludeTripId', { excludeTripId })
      .andWhere('t.status NOT IN (:...terminal)', {
        terminal: ['COMPLETED', 'CANCELLED'],
      })
      .getCount();

    if (conflict > 0) {
      throw new ConflictException(
        'Thuyền viên này đang thuộc một chuyến biển khác. Không thể thêm vào chuyến biển hiện tại.',
      );
    }
  }
}
