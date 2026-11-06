/**
 * PHASE 8 — Vessel Crew Business Service.
 *
 * PHASE 8 — User-scoped visibility.
 *   Users can only see crew members for vessels they own or are associated with.
 *
 * PHASE 8 — Authorization:
 *   Uses AuthorizationService for all access checks.
 *
 * PHASE 8 — Client-supplied userId: IGNORED in create.
 *   The userId is always set to the authenticated user.
 */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { VesselCrew } from './vessel-crew.entity';
import { Vessel } from '../vessel/vessel.entity';
import { FishingOperationProfileService } from '../fishing-operation-profile/fishing-operation-profile.service';
import { Logger } from '../services/logger.service';
import type { AuthUser } from '../auth/current-user.decorator';
import { AuthorizationService } from '../auth/authorization.service';

@Injectable()
export class VesselCrewService {
  private readonly logger = new Logger('VesselCrewService');

  constructor(
    @InjectRepository(VesselCrew)
    private readonly repository: Repository<VesselCrew>,
    @InjectRepository(Vessel)
    private readonly vesselRepo: Repository<Vessel>,
    private readonly profileService: FishingOperationProfileService,
    private readonly authService: AuthorizationService,
  ) {}

  /**
   * Find all crew members.
   * Only returns crew for vessels the user can access.
   * SUPER_ADMIN sees all.
   */
  async findAll(user?: AuthUser): Promise<VesselCrew[]> {
    this.logger.log({ event: 'findAll', userId: user?.accountId });

    if (!user?.accountId) {
      return [];
    }

    if (this.authService.isSuperAdmin(user)) {
      return this.repository
        .createQueryBuilder('vc')
        .leftJoinAndSelect('vc.vessel', 'vessel')
        .orderBy('vc.created_at', 'DESC')
        .getMany();
    }

    const vesselIds = await this.authService.getAllAccessibleVesselIds(user);
    if (vesselIds.length === 0) {
      return [];
    }

    return this.repository
      .createQueryBuilder('vc')
      .leftJoinAndSelect('vc.vessel', 'vessel')
      .where('vc.vessel_id IN (:...vesselIds)', { vesselIds })
      .orderBy('vc.created_at', 'DESC')
      .getMany();
  }

  async findByVessel(vesselId: string, user?: AuthUser): Promise<VesselCrew[]> {
    this.logger.log({
      event: 'findByVessel',
      vesselId,
      userId: user?.accountId,
    });

    if (user?.accountId && !this.authService.isSuperAdmin(user)) {
      const accessible = await this.authService.isMemberOfVessel(
        vesselId,
        user,
      );
      if (!accessible) {
        return [];
      }
    }

    return this.repository.find({
      where: { vesselId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, user?: AuthUser): Promise<VesselCrew> {
    this.logger.log({ event: 'findOne', id, userId: user?.accountId });
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['vessel'],
    });
    if (!entity) {
      throw new NotFoundException(`VesselCrew ${id} not found`);
    }

    if (user?.accountId && !this.authService.isSuperAdmin(user)) {
      const canAccess = await this.authService.isMemberOfVessel(
        entity.vesselId,
        user,
      );
      if (!canAccess) {
        throw new NotFoundException(`VesselCrew ${id} not found`);
      }
    }

    return entity;
  }

  /**
   * Resolve fishermanCode to userId before creating crew.
   */
  private async resolveUserId(data: DeepPartial<VesselCrew>): Promise<string> {
    if (data.userId) {
      return data.userId as string;
    }

    if (data['fishermanCode']) {
      const fishermanCode = data['fishermanCode'] as string;
      const resolved = await this.profileService.resolveUserIdByCode(
        fishermanCode,
      );

      if (!resolved) {
        throw new NotFoundException(
          `Fisherman with code ${fishermanCode} not found`,
        );
      }

      if (resolved.status === 'INACTIVE') {
        throw new BadRequestException(
          `Fisherman with code ${fishermanCode} is inactive`,
        );
      }

      this.logger.log({
        event: 'resolved.fishermanCode',
        fishermanCode,
        userId: resolved.userId,
      });

      return resolved.userId;
    }

    throw new BadRequestException(
      'Either userId or fishermanCode must be provided',
    );
  }

  async create(
    data: DeepPartial<VesselCrew>,
    user: AuthUser,
  ): Promise<VesselCrew> {
    this.logger.log({ event: 'create', data, userId: user.accountId });
    if (!user?.accountId) {
      throw new ForbiddenException('Authenticated user required');
    }

    if (!this.authService.isSuperAdmin(user)) {
      const canAccess = await this.authService.isMemberOfVessel(
        data.vesselId as string,
        user,
      );
      if (!canAccess) {
        throw new ForbiddenException('You do not have access to this vessel');
      }
    }

    const resolvedUserId = await this.resolveUserId(data);

    // Client-supplied userId is ignored; always use resolved userId
    const entity = this.repository.create({
      ...data,
      userId: resolvedUserId,
    });
    return this.repository.save(entity);
  }

  async update(
    id: string,
    data: QueryDeepPartialEntity<VesselCrew>,
    user: AuthUser,
  ): Promise<VesselCrew> {
    this.logger.log({
      event: 'update',
      id,
      changes: data,
      userId: user.accountId,
    });

    const entity = await this.findOne(id, user);

    if (data.vesselId && (data.vesselId as string) !== entity.vesselId) {
      if (!this.authService.isSuperAdmin(user)) {
        const canAccess = await this.authService.isMemberOfVessel(
          data.vesselId as string,
          user,
        );
        if (!canAccess) {
          throw new ForbiddenException('You do not have access to this vessel');
        }
      }
    }

    await this.repository.update(id, data);
    return this.findOne(id, user);
  }

  async remove(id: string, user?: AuthUser): Promise<void> {
    this.logger.log({ event: 'remove', id, userId: user?.accountId });

    await this.findOne(id, user);
    await this.repository.delete(id);
  }
}
