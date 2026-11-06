/**
 * PHASE 8 — Electronic Logbook · Catch Record CRUD passthrough.
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
  CreateCatchRecordDto,
  UpdateCatchRecordDto,
  QueryCatchRecordDto,
} from './dto';

@ApiTags(SwaggerTags.CATCH_RECORD)
@ApiBearerAuth('logbook-user')
@Controller('electronic-logbook/catch-records')
export class ElbCatchRecordController {
  @Get()
  @ApiOperation({ summary: 'List catch records' })
  async findAll(
    @Headers() { authorization },
    @Query() query: QueryCatchRecordDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: 'catch-records',
      authorization,
      query,
      res,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get catch record by ID' })
  @ApiParam({ name: 'id', description: 'Catch record UUID' })
  async findOne(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `catch-records/${id}`,
      authorization,
      res,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create catch record' })
  async create(
    @Headers() { authorization },
    @Body() body: CreateCatchRecordDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'post',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: 'catch-records',
      authorization,
      body,
      res,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update catch record' })
  @ApiParam({ name: 'id', description: 'Catch record UUID' })
  async update(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateCatchRecordDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'patch',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `catch-records/${id}`,
      authorization,
      body,
      res,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete catch record' })
  @ApiParam({ name: 'id', description: 'Catch record UUID' })
  async remove(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'delete',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `catch-records/${id}`,
      authorization,
      res,
    });
  }
}
