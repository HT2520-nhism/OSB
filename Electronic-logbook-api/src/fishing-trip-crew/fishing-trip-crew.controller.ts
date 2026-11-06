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

import { FishingTripCrewService } from './fishing-trip-crew.service';
import * as Dto from './dto';

import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';

@ApiBearerAuth('user')
@ApiTags('Fishing_trip_crew')
@UseGuards(LogbookJwtAuthGuard)
@Controller('fishing-trip-crew')
export class FishingTripCrewController {
  constructor(private readonly service: FishingTripCrewService) {}

  @Get()
  findAll(@Query() query: Dto.QueryFishingTripCrewDto) {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(
    @Body() dto: Dto.CreateFishingTripCrewDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Dto.UpdateFishingTripCrewDto,
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
