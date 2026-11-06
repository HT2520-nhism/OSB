/**
 * PHASE 8 — Electronic Logbook · Incident CRUD passthrough.
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
import { CreateIncidentDto, UpdateIncidentDto, QueryIncidentDto } from './dto';

@ApiTags(SwaggerTags.INCIDENT)
@ApiBearerAuth('logbook-user')
@Controller('electronic-logbook/incidents')
export class ElbIncidentController {
  @Get()
  @ApiOperation({ summary: 'List incidents' })
  async findAll(
    @Headers() { authorization },
    @Query() query: QueryIncidentDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: 'incidents',
      authorization,
      query,
      res,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get incident by ID' })
  @ApiParam({ name: 'id', description: 'Incident UUID' })
  async findOne(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `incidents/${id}`,
      authorization,
      res,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create incident' })
  async create(
    @Headers() { authorization },
    @Body() body: CreateIncidentDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'post',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: 'incidents',
      authorization,
      body,
      res,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update incident' })
  @ApiParam({ name: 'id', description: 'Incident UUID' })
  async update(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateIncidentDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'patch',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `incidents/${id}`,
      authorization,
      body,
      res,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete incident' })
  @ApiParam({ name: 'id', description: 'Incident UUID' })
  async remove(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'delete',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `incidents/${id}`,
      authorization,
      res,
    });
  }
}
