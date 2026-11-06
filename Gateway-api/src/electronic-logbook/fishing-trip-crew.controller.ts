/**
 * PHASE 8 — Electronic Logbook · Fishing Trip Crew CRUD passthrough.
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
  CreateFishingTripCrewDto,
  UpdateFishingTripCrewDto,
  QueryFishingTripCrewDto,
} from './dto';

@ApiTags(SwaggerTags.FISHING_TRIP_CREW)
@ApiBearerAuth('logbook-user')
@Controller('electronic-logbook/fishing-trip-crew')
export class ElbFishingTripCrewController {
  @Get()
  @ApiOperation({ summary: 'List fishing-trip crew records' })
  async findAll(
    @Headers() { authorization },
    @Query() query: QueryFishingTripCrewDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: 'fishing-trip-crew',
      authorization,
      query,
      res,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get fishing-trip crew record by ID' })
  @ApiParam({ name: 'id', description: 'Fishing-trip crew UUID' })
  async findOne(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `fishing-trip-crew/${id}`,
      authorization,
      res,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Add crew member to fishing trip' })
  async create(
    @Headers() { authorization },
    @Body() body: CreateFishingTripCrewDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'post',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: 'fishing-trip-crew',
      authorization,
      body,
      res,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update fishing-trip crew record' })
  @ApiParam({ name: 'id', description: 'Fishing-trip crew UUID' })
  async update(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateFishingTripCrewDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'patch',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `fishing-trip-crew/${id}`,
      authorization,
      body,
      res,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove fishing-trip crew record' })
  @ApiParam({ name: 'id', description: 'Fishing-trip crew UUID' })
  async remove(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'delete',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `fishing-trip-crew/${id}`,
      authorization,
      res,
    });
  }
}
