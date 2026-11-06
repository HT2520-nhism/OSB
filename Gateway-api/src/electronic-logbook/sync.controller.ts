/**
 * PHASE 8 — Electronic Logbook · Sync controller passthrough.
 *
 * Forwards /api/electronic-logbook/sync/* to the eLogbook API.
 */

import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { config } from '../config';
import { SwaggerTags } from '../constants/enums/swagger-tags.enum';
import { forwardToDownstream } from '../common/downstream.forwarder';
import { SyncPushDto, SyncPullDto, SyncRegisterDeviceDto } from './dto';

@ApiTags(SwaggerTags.SYNC)
@ApiBearerAuth('logbook-user')
@Controller('electronic-logbook/sync')
export class ElbSyncController {
  @Post('devices')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register or refresh a sync device' })
  async registerDevice(
    @Headers() { authorization },
    @Body() body: SyncRegisterDeviceDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'post',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: 'sync/devices',
      authorization,
      body,
      res,
    });
  }

  @Post('push')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Push a batch of offline operations' })
  async push(
    @Headers() { authorization },
    @Body() body: SyncPushDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'post',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: 'sync/push',
      authorization,
      body,
      res,
    });
  }

  @Get('pull')
  @ApiOperation({ summary: 'Cursor-based pull for offline sync' })
  @ApiQuery({ name: 'deviceId', required: false })
  async pull(
    @Headers() { authorization },
    @Query() query: SyncPullDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: 'sync/pull',
      authorization,
      query,
      res,
    });
  }

  @Get('conflicts')
  @ApiOperation({ summary: 'List pending sync conflicts' })
  @ApiQuery({ name: 'deviceId', required: false })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async conflicts(
    @Headers() { authorization },
    @Query() query: Record<string, unknown>,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: 'sync/conflicts',
      authorization,
      query,
      res,
    });
  }
}
