/**
 * PHASE 8 — Electronic Logbook · Vessel Crew CRUD passthrough.
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
  CreateVesselCrewDto,
  UpdateVesselCrewDto,
  QueryVesselCrewDto,
} from './dto';

@ApiTags(SwaggerTags.VESSEL_CREW)
@ApiBearerAuth('logbook-user')
@Controller('electronic-logbook/vessel-crew')
export class ElbVesselCrewController {
  @Get()
  @ApiOperation({ summary: 'List vessel crew records' })
  async findAll(
    @Headers() { authorization },
    @Query() query: QueryVesselCrewDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: 'vessel-crew',
      authorization,
      query,
      res,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vessel crew record by ID' })
  @ApiParam({ name: 'id', description: 'Vessel crew UUID' })
  async findOne(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `vessel-crew/${id}`,
      authorization,
      res,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Add vessel crew' })
  async create(
    @Headers() { authorization },
    @Body() body: CreateVesselCrewDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'post',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: 'vessel-crew',
      authorization,
      body,
      res,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update vessel crew record' })
  @ApiParam({ name: 'id', description: 'Vessel crew UUID' })
  async update(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateVesselCrewDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'patch',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `vessel-crew/${id}`,
      authorization,
      body,
      res,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove vessel crew record' })
  @ApiParam({ name: 'id', description: 'Vessel crew UUID' })
  async remove(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'delete',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `vessel-crew/${id}`,
      authorization,
      res,
    });
  }
}
