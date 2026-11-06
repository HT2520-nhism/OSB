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
import { FishingTripService } from './fishing-trip.service';
import * as Dto from './dto';

@ApiBearerAuth('user')
@ApiTags('Fishing_trip')
@UseGuards(LogbookJwtAuthGuard)
@Controller('fishing-trips')
export class FishingTripController {
  constructor(private readonly service: FishingTripService) {}

  @Get()
  findAll(
    @Query() query: Dto.QueryFishingTripDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.findAll(query, user);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.findOne(id, user);
  }

  @Post()
  create(@Body() dto: Dto.CreateFishingTripDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Dto.UpdateFishingTripDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.update(id, dto, user);
  }

  // ─── Explicit trip lifecycle endpoints ─────────────────────────────

  @Post(':id/prepare')
  prepare(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.prepareTrip(id, user);
  }

  @Post(':id/depart')
  depart(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.departTrip(id, user);
  }

  @Post(':id/start-fishing')
  startFishing(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.startFishing(id, user);
  }

  @Post(':id/start-returning')
  startReturning(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.startReturning(id, user);
  }

  @Post(':id/complete')
  complete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.completeTrip(id, user);
  }

  @Post(':id/cancel')
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.cancelTrip(id, user);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.remove(id, user);
  }
}
