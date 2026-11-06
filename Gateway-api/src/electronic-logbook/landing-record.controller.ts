/**
 * PHASE 8 — Electronic Logbook · Landing Record CRUD passthrough.
 *
 * Includes the nested add-catch action at /landing-records/:id/catches.
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
  Res,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { config } from '../config';
import { SwaggerTags } from '../constants/enums/swagger-tags.enum';
import { forwardToDownstream } from '../common/downstream.forwarder';
import {
  CreateLandingRecordDto,
  UpdateLandingRecordDto,
  CreateLandingCatchDto,
} from './dto';

@ApiTags(SwaggerTags.LANDING_RECORD)
@ApiBearerAuth('logbook-user')
@Controller('electronic-logbook/landing-records')
export class ElbLandingRecordController {
  @Get()
  @ApiOperation({ summary: 'List landing records' })
  @ApiQuery({ name: 'fishingTripId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Headers() { authorization },
    @Query() query: Record<string, unknown>,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: 'landing-records',
      authorization,
      query,
      res,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get landing record by ID' })
  @ApiParam({ name: 'id', description: 'Landing record UUID' })
  async findOne(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `landing-records/${id}`,
      authorization,
      res,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create landing record' })
  async create(
    @Headers() { authorization },
    @Body() body: CreateLandingRecordDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'post',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: 'landing-records',
      authorization,
      body,
      res,
    });
  }

  @Post(':id/catches')
  @ApiOperation({ summary: 'Add a catch to a landing record' })
  @ApiParam({ name: 'id', description: 'Landing record UUID' })
  async addCatch(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CreateLandingCatchDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'post',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `landing-records/${id}/catches`,
      authorization,
      body,
      res,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update landing record' })
  @ApiParam({ name: 'id', description: 'Landing record UUID' })
  async update(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateLandingRecordDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'patch',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `landing-records/${id}`,
      authorization,
      body,
      res,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete landing record' })
  @ApiParam({ name: 'id', description: 'Landing record UUID' })
  async remove(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'delete',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `landing-records/${id}`,
      authorization,
      res,
    });
  }
}
