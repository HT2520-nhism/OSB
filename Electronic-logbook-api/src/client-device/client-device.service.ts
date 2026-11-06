/**
 * PHASE 8 — Client Device Business Service.
 *
 * PHASE 8 — User-scoped visibility.
 *   Users can only see/manage their own devices.
 */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { ClientDevice } from './client-device.entity';
import { Logger } from '../services/logger.service';
import type { AuthUser } from '../auth/current-user.decorator';

@Injectable()
export class ClientDeviceService {
  private readonly logger = new Logger('ClientDeviceService');

  constructor(
    @InjectRepository(ClientDevice)
    private readonly repository: Repository<ClientDevice>,
  ) {}

  /**
   * Find all devices for the authenticated user.
   */
  async findAll(user?: AuthUser): Promise<ClientDevice[]> {
    this.logger.log({ event: 'findAll', userId: user?.accountId });

    if (!user?.accountId) {
      return [];
    }

    return this.repository.find({
      where: { userId: user.accountId },
      order: { lastSeenAt: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Find device by device-id string (not internal UUID).
   */
  async findByDeviceId(
    deviceId: string,
    user?: AuthUser,
  ): Promise<ClientDevice | null> {
    this.logger.log({
      event: 'findByDeviceId',
      deviceId,
      userId: user?.accountId,
    });

    const entity = await this.repository.findOne({ where: { deviceId } });
    if (!entity) return null;

    // If user is provided, verify ownership
    if (user?.accountId && entity.userId !== user.accountId) {
      return null;
    }

    return entity;
  }

  async findOne(id: string, user?: AuthUser): Promise<ClientDevice> {
    this.logger.log({ event: 'findOne', id, userId: user?.accountId });
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`ClientDevice ${id} not found`);
    }

    if (user?.accountId && entity.userId !== user.accountId) {
      throw new NotFoundException(`ClientDevice ${id} not found`);
    }

    return entity;
  }

  async create(
    data: DeepPartial<ClientDevice>,
    user: AuthUser,
  ): Promise<ClientDevice> {
    this.logger.log({ event: 'create', data, userId: user?.accountId });
    if (!user?.accountId) {
      throw new ForbiddenException('Authenticated user required');
    }

    const entity = this.repository.create({
      ...data,
      userId: user.accountId, // Always set to current user
    });
    return this.repository.save(entity);
  }

  async update(
    id: string,
    data: QueryDeepPartialEntity<ClientDevice>,
    user: AuthUser,
  ): Promise<ClientDevice> {
    this.logger.log({
      event: 'update',
      id,
      changes: data,
      userId: user?.accountId,
    });

    const entity = await this.findOne(id, user);

    // Prevent changing userId
    if (data.userId && (data.userId as string) !== entity.userId) {
      throw new ForbiddenException('Cannot reassign device to another user');
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
