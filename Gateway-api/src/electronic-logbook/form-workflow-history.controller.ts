/**
 * PHASE 8 — Electronic Logbook · Form Workflow History passthrough.
 *
 * Read-only audit log. No POST/PATCH/DELETE.
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

@ApiTags(SwaggerTags.FORM_WORKFLOW_HISTORY)
@ApiBearerAuth('logbook-user')
@Controller('electronic-logbook/form-workflow-histories')
export class ElbFormWorkflowHistoryController {
  @Get()
  @ApiOperation({ summary: 'List workflow history entries' })
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
      path: 'form-workflow-histories',
      authorization,
      query,
      res,
    });
  }

  @Get('by-submission/:formSubmissionId')
  @ApiOperation({ summary: 'Get history for a single form submission' })
  @ApiParam({ name: 'formSubmissionId', description: 'Form submission UUID' })
  async findBySubmissionId(
    @Headers() { authorization },
    @Param('formSubmissionId', ParseUUIDPipe) formSubmissionId: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `form-workflow-histories/by-submission/${formSubmissionId}`,
      authorization,
      res,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workflow history entry by ID' })
  @ApiParam({ name: 'id', description: 'History entry UUID' })
  async findOne(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `form-workflow-histories/${id}`,
      authorization,
      res,
    });
  }
}
