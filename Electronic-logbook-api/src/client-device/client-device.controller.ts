import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { LogbookJwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';

import { ClientDeviceService } from './client-device.service';
import * as Dto from './dto';

@ApiBearerAuth('user')
@ApiTags('Client_device')
@UseGuards(LogbookJwtAuthGuard)
@Controller('client-devices')
export class ClientDeviceController {
  constructor(private readonly service: ClientDeviceService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAll(user);
  }

  @Get('by-device-id/:deviceId')
  findByDeviceId(
    @Param('deviceId') deviceId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.findByDeviceId(deviceId, user);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.findOne(id, user);
  }

  @Post()
  create(
    @Body() dto: Dto.CreateClientDeviceDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.create(dto as any, user);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Dto.UpdateClientDeviceDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.update(id, dto as any, user);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.remove(id, user);
  }
}
