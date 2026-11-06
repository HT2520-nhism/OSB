/**
 * PHASE 8 — Electronic Logbook · Vessel Owner CRUD passthrough.
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
  CreateVesselOwnerDto,
  UpdateVesselOwnerDto,
  QueryVesselOwnerDto,
} from './dto';

@ApiTags(SwaggerTags.VESSEL_OWNER)
@ApiBearerAuth('logbook-user')
@Controller('electronic-logbook/vessel-owners')
export class ElbVesselOwnerController {
  @Get()
  @ApiOperation({ summary: 'List vessel owners' })
  async findAll(
    @Headers() { authorization },
    @Query() query: QueryVesselOwnerDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: 'vessel-owners',
      authorization,
      query,
      res,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vessel owner by ID' })
  @ApiParam({ name: 'id', description: 'Vessel owner UUID' })
  async findOne(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `vessel-owners/${id}`,
      authorization,
      res,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create vessel owner' })
  async create(
    @Headers() { authorization },
    @Body() body: CreateVesselOwnerDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'post',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: 'vessel-owners',
      authorization,
      body,
      res,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update vessel owner' })
  @ApiParam({ name: 'id', description: 'Vessel owner UUID' })
  async update(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateVesselOwnerDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'patch',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `vessel-owners/${id}`,
      authorization,
      body,
      res,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete vessel owner' })
  @ApiParam({ name: 'id', description: 'Vessel owner UUID' })
  async remove(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'delete',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `vessel-owners/${id}`,
      authorization,
      res,
    });
  }
}
