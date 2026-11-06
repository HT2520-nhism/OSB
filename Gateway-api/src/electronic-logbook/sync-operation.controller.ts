/**
 * PHASE 8 — Electronic Logbook · Sync Operation CRUD passthrough.
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
  CreateSyncOperationDto,
  UpdateSyncOperationDto,
  QuerySyncOperationDto,
} from './dto';

@ApiTags(SwaggerTags.SYNC_OPERATION)
@ApiBearerAuth('logbook-user')
@Controller('electronic-logbook/sync-operations')
export class ElbSyncOperationController {
  @Get()
  @ApiOperation({ summary: 'List sync operations' })
  async findAll(
    @Headers() { authorization },
    @Query() query: QuerySyncOperationDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: 'sync-operations',
      authorization,
      query,
      res,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sync operation by ID' })
  @ApiParam({ name: 'id', description: 'Sync operation UUID' })
  async findOne(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `sync-operations/${id}`,
      authorization,
      res,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create sync operation' })
  async create(
    @Headers() { authorization },
    @Body() body: CreateSyncOperationDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'post',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: 'sync-operations',
      authorization,
      body,
      res,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update sync operation' })
  @ApiParam({ name: 'id', description: 'Sync operation UUID' })
  async update(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateSyncOperationDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'patch',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `sync-operations/${id}`,
      authorization,
      body,
      res,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete sync operation' })
  @ApiParam({ name: 'id', description: 'Sync operation UUID' })
  async remove(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'delete',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `sync-operations/${id}`,
      authorization,
      res,
    });
  }
}
