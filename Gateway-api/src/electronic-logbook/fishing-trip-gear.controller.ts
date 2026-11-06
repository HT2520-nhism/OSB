/**
 * PHASE 8 — Electronic Logbook · Fishing Trip Gear CRUD passthrough.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { config } from '../config';
import { SwaggerTags } from '../constants/enums/swagger-tags.enum';
import { forwardToDownstream } from '../common/downstream.forwarder';
import {
  CreateFishingTripGearDto,
  UpdateFishingTripGearDto,
  QueryFishingTripGearDto,
} from './dto';

@ApiTags(SwaggerTags.FISHING_TRIP_GEAR)
@ApiBearerAuth('logbook-user')
@Controller('electronic-logbook/fishing-trip-gears')
export class ElbFishingTripGearController {
  @Get()
  @ApiOperation({ summary: 'List fishing-trip gear associations' })
  async findAll(
    @Headers() { authorization },
    @Query() query: QueryFishingTripGearDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: 'fishing-trip-gears',
      authorization,
      query,
      res,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get fishing-trip gear by ID' })
  @ApiParam({ name: 'id', description: 'Fishing-trip gear UUID' })
  async findOne(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `fishing-trip-gears/${id}`,
      authorization,
      res,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Add gear to a fishing trip' })
  async create(
    @Headers() { authorization },
    @Body() body: CreateFishingTripGearDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'post',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: 'fishing-trip-gears',
      authorization,
      body,
      res,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update fishing-trip gear' })
  @ApiParam({ name: 'id', description: 'Fishing-trip gear UUID' })
  async update(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateFishingTripGearDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'patch',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `fishing-trip-gears/${id}`,
      authorization,
      body,
      res,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove fishing-trip gear' })
  @ApiParam({ name: 'id', description: 'Fishing-trip gear UUID' })
  async remove(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'delete',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `fishing-trip-gears/${id}`,
      authorization,
      res,
    });
  }
}
