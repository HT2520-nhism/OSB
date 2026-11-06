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

import { FishingGearService } from './fishing-gear.service';
import * as Dto from './dto';

@ApiBearerAuth('user')
@ApiTags('Fishing_gear')
@UseGuards(LogbookJwtAuthGuard)
@Controller('fishing-gears')
export class FishingGearController {
  constructor(private readonly service: FishingGearService) {}

  @Get()
  findAll(@Query() query: Dto.QueryFishingGearDto) {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: Dto.CreateFishingGearDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Dto.UpdateFishingGearDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
