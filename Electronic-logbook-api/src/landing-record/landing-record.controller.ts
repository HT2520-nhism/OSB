import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { LogbookJwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';

import { LandingRecordService } from './landing-record.service';
import * as Dto from './dto';

@ApiBearerAuth('user')
@ApiTags('Landing_record')
@UseGuards(LogbookJwtAuthGuard)
@Controller('landing-records')
export class LandingRecordController {
  constructor(private readonly service: LandingRecordService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAll(user);
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
    @Body() dto: Dto.CreateLandingRecordDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.createLanding(
      {
        fishingTripId: dto.fishingTripId,
        landingPortCode: dto.landingPortCode,
        landedAt: dto.landedAt,
        notes: dto.notes,
      },
      user,
    );
  }

  /**
   * Add a LandingCatch to an existing LandingRecord and recompute total.
   */
  @Post(':id/catches')
  addCatch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    body: {
      speciesCode?: string;
      speciesName?: string;
      quantity?: number;
      unit?: string;
    },
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.addCatch(id, body, user);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Dto.UpdateLandingRecordDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.remove(id, user);
  }
}
