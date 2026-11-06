/**
 * PHASE 8 — Electronic Logbook · Sync Conflict CRUD passthrough.
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
  CreateSyncConflictDto,
  UpdateSyncConflictDto,
  QuerySyncConflictDto,
} from './dto';

@ApiTags(SwaggerTags.SYNC_CONFLICT)
@ApiBearerAuth('logbook-user')
@Controller('electronic-logbook/sync-conflicts')
export class ElbSyncConflictController {
  @Get()
  @ApiOperation({ summary: 'List sync conflicts' })
  async findAll(
    @Headers() { authorization },
    @Query() query: QuerySyncConflictDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: 'sync-conflicts',
      authorization,
      query,
      res,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sync conflict by ID' })
  @ApiParam({ name: 'id', description: 'Sync conflict UUID' })
  async findOne(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `sync-conflicts/${id}`,
      authorization,
      res,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create sync conflict' })
  async create(
    @Headers() { authorization },
    @Body() body: CreateSyncConflictDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'post',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: 'sync-conflicts',
      authorization,
      body,
      res,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update sync conflict' })
  @ApiParam({ name: 'id', description: 'Sync conflict UUID' })
  async update(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateSyncConflictDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'patch',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `sync-conflicts/${id}`,
      authorization,
      body,
      res,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete sync conflict' })
  @ApiParam({ name: 'id', description: 'Sync conflict UUID' })
  async remove(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'delete',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `sync-conflicts/${id}`,
      authorization,
      res,
    });
  }
}
