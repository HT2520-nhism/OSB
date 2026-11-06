/**
 * PHASE 6 — Sync Device Service.
 *
 * Wraps the existing ClientDeviceService with sync-specific concerns:
 *  - registration/activation on first use
 *  - ownership check (device must belong to authenticated user)
 *  - active-status check (REVOKED / INACTIVE devices must not sync)
 */

import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { ClientDevice } from '../client-device/client-device.entity';
import { SyncDeviceStatus } from './sync.enum';
import { AuthUser } from '../auth/current-user.decorator';
import { Logger } from '../services/logger.service';

@Injectable()
export class SyncDeviceService {
  private readonly logger = new Logger('SyncDeviceService');

  constructor(
    @InjectRepository(ClientDevice)
    private readonly repository: Repository<ClientDevice>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Look up a device by its stable deviceId.
   */
  async findByDeviceId(deviceId: string): Promise<ClientDevice | null> {
    return this.repository.findOne({ where: { deviceId } });
  }

  /**
   * Register or refresh a device. If the deviceId already exists and is
   * owned by the same authenticated user, this is an idempotent
   * "touch" (lastSeenAt + lastSyncAt + status=ACTIVE).
   *
   * If the deviceId exists but is owned by a different user, the
   * request is rejected.
   *
   * If the deviceId has never been seen, it is created and bound to
   * the authenticated user.
   */
  async register(
    input: { deviceId: string; platform?: string; appVersion?: string },
    user: AuthUser,
  ): Promise<ClientDevice> {
    if (!user?.accountId) {
      throw new ForbiddenException('Authenticated user required');
    }
    const existing = await this.findByDeviceId(input.deviceId);
    if (existing) {
      if (existing.userId !== user.accountId) {
        // Do NOT allow device takeover.
        throw new ForbiddenException(
          'Device is registered to a different account',
        );
      }
      return this.touch(existing, input.platform, input.appVersion);
    }
    return this.dataSource.transaction(async (manager) => {
      const entity = manager.create(ClientDevice, {
        userId: user.accountId,
        deviceId: input.deviceId,
        platform: input.platform ?? null,
        appVersion: input.appVersion ?? null,
        status: SyncDeviceStatus.ACTIVE,
        lastSeenAt: new Date(),
        lastSyncAt: null,
      });
      const saved = await manager.save(entity);
      this.logger.log({
        event: 'sync-device.register',
        deviceId: saved.deviceId,
        userId: user.accountId,
      });
      return saved;
    });
  }

  /**
   * Validate that the device exists, belongs to the authenticated user,
   * and is in an ACTIVE state.
   *
   * Throws:
   *  - NotFoundException if device is missing
   *  - ForbiddenException if device belongs to a different user or is revoked
   */
  async assertAuthorized(
    deviceId: string,
    user: AuthUser,
  ): Promise<ClientDevice> {
    if (!user?.accountId) {
      throw new ForbiddenException('Authenticated user required');
    }
    const device = await this.findByDeviceId(deviceId);
    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not registered`);
    }
    if (device.userId !== user.accountId) {
      throw new ForbiddenException(
        'Device does not belong to authenticated user',
      );
    }
    if (device.status && device.status !== SyncDeviceStatus.ACTIVE) {
      throw new ConflictException(
        `Device ${deviceId} is ${device.status}; cannot sync`,
      );
    }
    return device;
  }

  async recordSyncSuccess(deviceId: string): Promise<void> {
    const device = await this.findByDeviceId(deviceId);
    if (!device) return;
    device.lastSyncAt = new Date();
    device.lastSeenAt = new Date();
    await this.repository.save(device);
  }

  /**
   * Return all devices owned by the given user, ordered by lastSyncAt DESC.
   * Used by /sync/status to surface lastSyncedAt / deviceCount to mobile.
   */
  async listForUser(accountId: string): Promise<ClientDevice[]> {
    return this.repository.find({
      where: { userId: accountId },
      order: { lastSyncAt: 'DESC' },
    });
  }

  private async touch(
    device: ClientDevice,
    platform?: string,
    appVersion?: string,
  ): Promise<ClientDevice> {
    if (platform) device.platform = platform;
    if (appVersion) device.appVersion = appVersion;
    device.lastSeenAt = new Date();
    if (!device.status) device.status = SyncDeviceStatus.ACTIVE;
    return this.repository.save(device);
  }
}
