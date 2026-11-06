/**
 * PHASE 8 — Electronic Logbook · Fishing Trip CRUD + lifecycle passthrough.
 *
 * Lifecycle actions: prepare / depart / start-fishing / start-returning /
 * complete / cancel. Mirrored 1:1 from the downstream controller.
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
  HttpCode,
  HttpStatus,
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
  CreateFishingTripDto,
  UpdateFishingTripDto,
  QueryFishingTripDto,
} from './dto';

@ApiTags(SwaggerTags.FISHING_TRIP)
@ApiBearerAuth('logbook-user')
@Controller('electronic-logbook/fishing-trips')
export class ElbFishingTripController {
  @Get()
  @ApiOperation({ summary: 'List fishing trips' })
  async findAll(
    @Headers() { authorization },
    @Query() query: QueryFishingTripDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: 'fishing-trips',
      authorization,
      query,
      res,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get fishing trip by ID' })
  @ApiParam({ name: 'id', description: 'Fishing trip UUID' })
  async findOne(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `fishing-trips/${id}`,
      authorization,
      res,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create fishing trip' })
  async create(
    @Headers() { authorization },
    @Body() body: CreateFishingTripDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'post',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: 'fishing-trips',
      authorization,
      body,
      res,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update fishing trip' })
  @ApiParam({ name: 'id', description: 'Fishing trip UUID' })
  async update(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateFishingTripDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'patch',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `fishing-trips/${id}`,
      authorization,
      body,
      res,
    });
  }

  @Post(':id/prepare')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transition: DRAFT → PREPARED' })
  @ApiParam({ name: 'id', description: 'Fishing trip UUID' })
  async prepare(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'post',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `fishing-trips/${id}/prepare`,
      authorization,
      res,
    });
  }

  @Post(':id/depart')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transition: PREPARED → DEPARTED' })
  @ApiParam({ name: 'id', description: 'Fishing trip UUID' })
  async depart(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'post',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `fishing-trips/${id}/depart`,
      authorization,
      res,
    });
  }

  @Post(':id/start-fishing')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transition: DEPARTED → FISHING' })
  @ApiParam({ name: 'id', description: 'Fishing trip UUID' })
  async startFishing(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'post',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `fishing-trips/${id}/start-fishing`,
      authorization,
      res,
    });
  }

  @Post(':id/start-returning')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transition: FISHING → RETURNING' })
  @ApiParam({ name: 'id', description: 'Fishing trip UUID' })
  async startReturning(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'post',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `fishing-trips/${id}/start-returning`,
      authorization,
      res,
    });
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transition: RETURNING → COMPLETED' })
  @ApiParam({ name: 'id', description: 'Fishing trip UUID' })
  async complete(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'post',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `fishing-trips/${id}/complete`,
      authorization,
      res,
    });
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transition: any → CANCELLED' })
  @ApiParam({ name: 'id', description: 'Fishing trip UUID' })
  async cancel(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'post',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `fishing-trips/${id}/cancel`,
      authorization,
      res,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete fishing trip' })
  @ApiParam({ name: 'id', description: 'Fishing trip UUID' })
  async remove(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'delete',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `fishing-trips/${id}`,
      authorization,
      res,
    });
  }
}
