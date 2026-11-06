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

import { VesselOwnerService } from './vessel-owner.service';
import * as Dto from './dto';

import { LogbookJwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';

@ApiBearerAuth('user')
@ApiTags('Vessel_owner')
@UseGuards(LogbookJwtAuthGuard)
@Controller('vessel-owners')
export class VesselOwnerController {
  constructor(private readonly service: VesselOwnerService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAll(user);
  }

  @Get('vessel/:vesselId')
  findByVessel(
    @Param('vesselId', ParseUUIDPipe) vesselId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.findByVessel(vesselId, user);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.findOne(id, user);
  }

  @Post()
  create(@Body() dto: Dto.CreateVesselOwnerDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto as any, user);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Dto.UpdateVesselOwnerDto,
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
