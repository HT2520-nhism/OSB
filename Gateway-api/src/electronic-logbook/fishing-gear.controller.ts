/**
 * PHASE 8 — Electronic Logbook · Fishing Gear CRUD passthrough.
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
  CreateFishingGearDto,
  UpdateFishingGearDto,
  QueryFishingGearDto,
} from './dto';

@ApiTags(SwaggerTags.FISHING_GEAR)
@ApiBearerAuth('logbook-user')
@Controller('electronic-logbook/fishing-gears')
export class ElbFishingGearController {
  @Get()
  @ApiOperation({ summary: 'List fishing gears' })
  async findAll(
    @Headers() { authorization },
    @Query() query: QueryFishingGearDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: 'fishing-gears',
      authorization,
      query,
      res,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get fishing gear by ID' })
  @ApiParam({ name: 'id', description: 'Fishing gear UUID' })
  async findOne(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `fishing-gears/${id}`,
      authorization,
      res,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create fishing gear' })
  async create(
    @Headers() { authorization },
    @Body() body: CreateFishingGearDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'post',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: 'fishing-gears',
      authorization,
      body,
      res,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update fishing gear' })
  @ApiParam({ name: 'id', description: 'Fishing gear UUID' })
  async update(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateFishingGearDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'patch',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `fishing-gears/${id}`,
      authorization,
      body,
      res,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete fishing gear' })
  @ApiParam({ name: 'id', description: 'Fishing gear UUID' })
  async remove(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'delete',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `fishing-gears/${id}`,
      authorization,
      res,
    });
  }
}
