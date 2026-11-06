/**
 * PHASE 8 — Electronic Logbook · Form Submission Data (read-only) passthrough.
 */

import {
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Res,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { config } from '../config';
import { SwaggerTags } from '../constants/enums/swagger-tags.enum';
import { forwardToDownstream } from '../common/downstream.forwarder';

@ApiTags(SwaggerTags.FORM_SUBMISSION_DATA)
@ApiBearerAuth('logbook-user')
@Controller('electronic-logbook/form-submission-data')
export class ElbFormSubmissionDataController {
  @Get()
  @ApiOperation({ summary: 'List form submission data records' })
  @ApiQuery({ name: 'formSubmissionId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Headers() { authorization },
    @Query() query: Record<string, unknown>,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: 'form-submission-data',
      authorization,
      query,
      res,
    });
  }

  @Get('by-submission/:formSubmissionId')
  @ApiOperation({ summary: 'Get data record for a submission' })
  @ApiParam({ name: 'formSubmissionId', description: 'Form submission UUID' })
  async findBySubmissionId(
    @Headers() { authorization },
    @Param('formSubmissionId', ParseUUIDPipe) formSubmissionId: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `form-submission-data/by-submission/${formSubmissionId}`,
      authorization,
      res,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific data record' })
  @ApiParam({ name: 'id', description: 'Data record UUID' })
  async findOne(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `form-submission-data/${id}`,
      authorization,
      res,
    });
  }
}
