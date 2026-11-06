/**
 * PHASE 8 — Electronic Logbook · Landing Catch CRUD passthrough.
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
  CreateLandingCatchDto,
  UpdateLandingCatchDto,
  QueryLandingCatchDto,
} from './dto';

@ApiTags(SwaggerTags.LANDING_CATCH)
@ApiBearerAuth('logbook-user')
@Controller('electronic-logbook/landing-catches')
export class ElbLandingCatchController {
  @Get()
  @ApiOperation({ summary: 'List landing catches' })
  async findAll(
    @Headers() { authorization },
    @Query() query: QueryLandingCatchDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: 'landing-catches',
      authorization,
      query,
      res,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get landing catch by ID' })
  @ApiParam({ name: 'id', description: 'Landing catch UUID' })
  async findOne(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `landing-catches/${id}`,
      authorization,
      res,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create landing catch' })
  async create(
    @Headers() { authorization },
    @Body() body: CreateLandingCatchDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'post',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: 'landing-catches',
      authorization,
      body,
      res,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update landing catch' })
  @ApiParam({ name: 'id', description: 'Landing catch UUID' })
  async update(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateLandingCatchDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'patch',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `landing-catches/${id}`,
      authorization,
      body,
      res,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete landing catch' })
  @ApiParam({ name: 'id', description: 'Landing catch UUID' })
  async remove(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'delete',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `landing-catches/${id}`,
      authorization,
      res,
    });
  }
}
