/**
 * PHASE 6 — Sync Controller.
 *
 * Endpoints:
 *  POST /sync/devices          — register or refresh a device
 *  POST /sync/push             — push a batch of operations
 *  GET  /sync/pull             — cursor-based pull
 *  GET  /sync/conflicts        — list conflicts (read-only)
 *  GET  /sync/status           — current sync status for the caller (mobile dashboard)
 *
 * All endpoints require authentication (LogbookJwtAuthGuard) and
 * reject requests when the device does not belong to the user.
 */

import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { LogbookJwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';

import { SyncPushService } from './sync-push.service';
import { SyncPullService } from './sync-pull.service';
import { SyncDeviceService } from './sync-device.service';
import { SyncConflictService } from './sync-conflict.service';

import {
  SyncPushDto,
  SyncPullDto,
  SyncRegisterDeviceDto,
} from './dto/sync.dto';

@ApiBearerAuth('user')
@ApiTags('Sync')
@UseGuards(LogbookJwtAuthGuard)
@Controller('sync')
export class SyncController {
  constructor(
    private readonly pushService: SyncPushService,
    private readonly pullService: SyncPullService,
    private readonly deviceService: SyncDeviceService,
    private readonly conflictService: SyncConflictService,
  ) {}

  @Post('devices')
  @HttpCode(200)
  registerDevice(
    @Body() dto: SyncRegisterDeviceDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.deviceService.register(
      {
        deviceId: dto.deviceId,
        platform: dto.platform,
        appVersion: dto.appVersion,
      },
      user,
    );
  }

  @Post('push')
  @HttpCode(200)
  push(@Body() dto: SyncPushDto, @CurrentUser() user: AuthUser) {
    return this.pushService.push(dto, user);
  }

  @Get('pull')
  pull(
    @Query() query: SyncPullDto,
    @Query('deviceId') deviceId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.pullService.pull(query, user, deviceId);
  }

  @Get('conflicts')
  conflicts() {
    return this.conflictService.findAll();
  }

  /**
   * Standalone sync status endpoint — returns aggregate counters used by the
   * mobile sync banner. Pulled by Gateway dashboard/trip-overview aggregator.
   */
  @Get('status')
  async status(@CurrentUser() user: AuthUser) {
    const devices = await this.deviceService.listForUser(user.accountId);
    return {
      status: 'OK',
      lastSyncedAt: devices?.[0]?.lastSyncAt ?? null,
      deviceCount: devices?.length ?? 0,
      pendingChanges: 0,
      conflictCount: await this.conflictService.countForUser(user.accountId),
    };
  }
}
