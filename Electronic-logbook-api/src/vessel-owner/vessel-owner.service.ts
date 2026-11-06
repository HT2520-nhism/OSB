/**
 * PHASE 8 — Vessel Owner Business Service.
 *
 * PHASE 8 — User-scoped visibility.
 *   Users can only see vessel owners for vessels they own or are associated with.
 *
 * PHASE 8 — Authorization:
 *   Uses AuthorizationService for all access checks.
 */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { VesselOwner } from './vessel-owner.entity';
import { Vessel } from '../vessel/vessel.entity';
import { Logger } from '../services/logger.service';
import type { AuthUser } from '../auth/current-user.decorator';
import { AuthorizationService } from '../auth/authorization.service';

@Injectable()
export class VesselOwnerService {
  private readonly logger = new Logger('VesselOwnerService');

  constructor(
    @InjectRepository(VesselOwner)
    private readonly repository: Repository<VesselOwner>,
    @InjectRepository(Vessel)
    private readonly vesselRepo: Repository<Vessel>,
    private readonly authService: AuthorizationService,
  ) {}

  /**
   * Find all vessel owners.
   * Only returns owners for vessels the user can access.
   * SUPER_ADMIN sees all vessel owners.
   */
  async findAll(user?: AuthUser): Promise<VesselOwner[]> {
    this.logger.log({ event: 'findAll', userId: user?.accountId });

    if (!user?.accountId) {
      return [];
    }

    if (this.authService.isSuperAdmin(user)) {
      return this.repository
        .createQueryBuilder('vo')
        .leftJoinAndSelect('vo.vessel', 'vessel')
        .orderBy('vo.created_at', 'DESC')
        .getMany();
    }

    const accessibleIds = await this.authService.getAllAccessibleVesselIds(
      user,
    );
    if (accessibleIds.length === 0) {
      return [];
    }

    return this.repository
      .createQueryBuilder('vo')
      .leftJoinAndSelect('vo.vessel', 'vessel')
      .where('vo.vessel_id IN (:...accessibleIds)', { accessibleIds })
      .orderBy('vo.created_at', 'DESC')
      .getMany();
  }

  async findByVessel(
    vesselId: string,
    user?: AuthUser,
  ): Promise<VesselOwner[]> {
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

  async findOne(id: string, user?: AuthUser): Promise<VesselOwner> {
    this.logger.log({ event: 'findOne', id, userId: user?.accountId });
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['vessel'],
    });
    if (!entity) {
      throw new NotFoundException(`VesselOwner ${id} not found`);
    }

    if (user?.accountId && !this.authService.isSuperAdmin(user)) {
      const canAccess = await this.authService.isMemberOfVessel(
        entity.vesselId,
        user,
      );
      if (!canAccess) {
        throw new NotFoundException(`VesselOwner ${id} not found`);
      }
    }

    return entity;
  }

  async create(
    data: DeepPartial<VesselOwner>,
    user: AuthUser,
  ): Promise<VesselOwner> {
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

    // Client-supplied userId is NOT trusted — always set to current user
    const entity = this.repository.create({
      ...data,
      userId: user.accountId,
    });
    return this.repository.save(entity);
  }

  async update(
    id: string,
    data: QueryDeepPartialEntity<VesselOwner>,
    user: AuthUser,
  ): Promise<VesselOwner> {
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
