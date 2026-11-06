/**
 * PHASE 8 — Electronic Logbook · Fuel Record CRUD passthrough.
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
  CreateFuelRecordDto,
  UpdateFuelRecordDto,
  QueryFuelRecordDto,
} from './dto';

@ApiTags(SwaggerTags.FUEL_RECORD)
@ApiBearerAuth('logbook-user')
@Controller('electronic-logbook/fuel-records')
export class ElbFuelRecordController {
  @Get()
  @ApiOperation({ summary: 'List fuel records' })
  async findAll(
    @Headers() { authorization },
    @Query() query: QueryFuelRecordDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: 'fuel-records',
      authorization,
      query,
      res,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get fuel record by ID' })
  @ApiParam({ name: 'id', description: 'Fuel record UUID' })
  async findOne(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `fuel-records/${id}`,
      authorization,
      res,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create fuel record' })
  async create(
    @Headers() { authorization },
    @Body() body: CreateFuelRecordDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'post',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: 'fuel-records',
      authorization,
      body,
      res,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update fuel record' })
  @ApiParam({ name: 'id', description: 'Fuel record UUID' })
  async update(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateFuelRecordDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'patch',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `fuel-records/${id}`,
      authorization,
      body,
      res,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete fuel record' })
  @ApiParam({ name: 'id', description: 'Fuel record UUID' })
  async remove(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'delete',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `fuel-records/${id}`,
      authorization,
      res,
    });
  }
}
