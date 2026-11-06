/**
 * PHASE 8 — Electronic Logbook · Regulatory Forms (M01/M02/M03) passthrough.
 */

import { Body, Controller, Post, Headers, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { config } from '../config';
import { SwaggerTags } from '../constants/enums/swagger-tags.enum';
import { forwardToDownstream } from '../common/downstream.forwarder';
import { CreateM01Dto, CreateM02Dto, CreateM03Dto } from './dto';

@ApiTags(SwaggerTags.REGULATORY_FORMS)
@ApiBearerAuth('logbook-user')
@Controller('electronic-logbook/forms')
export class ElbRegulatoryFormsController {
  @Post('m01')
  @ApiOperation({ summary: 'Submit Mẫu 01 — Fishing log' })
  async createM01(
    @Headers() { authorization },
    @Body() body: CreateM01Dto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'post',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: 'forms/m01',
      authorization,
      body,
      res,
    });
  }

  @Post('m02')
  @ApiOperation({ summary: 'Submit Mẫu 02 — Inspection report' })
  async createM02(
    @Headers() { authorization },
    @Body() body: CreateM02Dto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'post',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: 'forms/m02',
      authorization,
      body,
      res,
    });
  }

  @Post('m03')
  @ApiOperation({ summary: 'Submit Mẫu 03 — Pre-trip inspection' })
  async createM03(
    @Headers() { authorization },
    @Body() body: CreateM03Dto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'post',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: 'forms/m03',
      authorization,
      body,
      res,
    });
  }
}
