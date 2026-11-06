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

import { FishingTripGearService } from './fishing-trip-gear.service';
import * as Dto from './dto';

@ApiBearerAuth('user')
@ApiTags('Fishing_trip_gear')
@UseGuards(LogbookJwtAuthGuard)
@Controller('fishing-trip-gears')
export class FishingTripGearController {
  constructor(private readonly service: FishingTripGearService) {}

  @Get()
  findAll(@Query() query: Dto.QueryFishingTripGearDto) {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: Dto.CreateFishingTripGearDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Dto.UpdateFishingTripGearDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
