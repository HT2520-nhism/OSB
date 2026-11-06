/**
 * PHASE 8 — Electronic Logbook · Form Submission Version (read-only) passthrough.
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

@ApiTags(SwaggerTags.FORM_SUBMISSION_VERSION)
@ApiBearerAuth('logbook-user')
@Controller('electronic-logbook/form-submission-versions')
export class ElbFormSubmissionVersionController {
  @Get()
  @ApiOperation({ summary: 'List all form submission versions' })
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
      path: 'form-submission-versions',
      authorization,
      query,
      res,
    });
  }

  @Get('by-submission/:formSubmissionId')
  @ApiOperation({ summary: 'List versions for a specific submission' })
  @ApiParam({ name: 'formSubmissionId', description: 'Form submission UUID' })
  async findBySubmissionId(
    @Headers() { authorization },
    @Param('formSubmissionId', ParseUUIDPipe) formSubmissionId: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `form-submission-versions/by-submission/${formSubmissionId}`,
      authorization,
      res,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific version snapshot' })
  @ApiParam({ name: 'id', description: 'Version UUID' })
  async findOne(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `form-submission-versions/${id}`,
      authorization,
      res,
    });
  }
}
