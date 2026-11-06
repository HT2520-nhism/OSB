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

import { LandingCatchService } from './landing-catch.service';
import * as Dto from './dto';

@ApiBearerAuth('user')
@ApiTags('Landing_catch')
@UseGuards(LogbookJwtAuthGuard)
@Controller('landing-catches')
export class LandingCatchController {
  constructor(private readonly service: LandingCatchService) {}

  @Get()
  findAll(@Query() query: Dto.QueryLandingCatchDto) {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: Dto.CreateLandingCatchDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Dto.UpdateLandingCatchDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
