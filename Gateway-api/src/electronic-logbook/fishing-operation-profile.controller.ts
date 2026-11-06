/**
 * PHASE 8 — Electronic Logbook · Fishing Operation Profile passthrough.
 *
 * Provides fisherman/crew search and profile management.
 */
import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { config } from '../config';
import { SwaggerTags } from '../constants/enums/swagger-tags.enum';
import { forwardToDownstream } from '../common/downstream.forwarder';
import {
  CreateFishingOperationProfileDto,
  SearchFishingOperationProfileDto,
  FishingOperationProfileResponseDto,
} from './dto';

@ApiTags(SwaggerTags.FISHING_OPERATION_PROFILE)
@ApiBearerAuth('logbook-user')
@Controller('electronic-logbook/fishing-operation-profiles')
export class ElbFishingOperationProfileController {
  @Get()
  @ApiOperation({
    summary: 'Search fishing operation profiles by fishermanCode or userId',
  })
  async search(
    @Headers() { authorization },
    @Query() query: SearchFishingOperationProfileDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: 'fishing-operation-profiles',
      authorization,
      query,
      res,
    });
  }

  @Get('by-code/:fishermanCode')
  @ApiOperation({ summary: 'Get fishing operation profile by fisherman code' })
  async findByCode(
    @Headers() { authorization },
    @Param('fishermanCode') fishermanCode: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `fishing-operation-profiles/by-code/${fishermanCode}`,
      authorization,
      res,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get fishing operation profile by ID' })
  async findOne(
    @Headers() { authorization },
    @Param('id') id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `fishing-operation-profiles/${id}`,
      authorization,
      res,
    });
  }

  @Post()
  @ApiOperation({
    summary: 'Create fishing operation profile (auto-generates fisherman code)',
  })
  async create(
    @Headers() { authorization },
    @Body() body: CreateFishingOperationProfileDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'post',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: 'fishing-operation-profiles',
      authorization,
      body,
      res,
    });
  }
}
