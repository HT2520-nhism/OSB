/**
 * PHASE 8 — Electronic Logbook · Form Submission (CRUD + Workflow) passthrough.
 *
 * The downstream exposes both REST CRUD and explicit state transitions
 * (submit / start-review / approve / reject / cancel / reopen / update-data).
 * All are forwarded 1:1 so the Gateway surface matches the source.
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
  HttpCode,
  HttpStatus,
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
  CreateFormSubmissionDto,
  UpdateFormSubmissionDto,
  QueryFormSubmissionDto,
  UpdateFormSubmissionDataDto,
} from './dto';

@ApiTags(SwaggerTags.FORM_SUBMISSION)
@ApiBearerAuth('logbook-user')
@Controller('electronic-logbook/form-submissions')
export class ElbFormSubmissionController {
  @Get()
  @ApiOperation({ summary: 'List form submissions' })
  async findAll(
    @Headers() { authorization },
    @Query() query: QueryFormSubmissionDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: 'form-submissions',
      authorization,
      query,
      res,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get form submission by ID' })
  @ApiParam({ name: 'id', description: 'Form submission UUID' })
  async findOne(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `form-submissions/${id}`,
      authorization,
      res,
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create form submission (DRAFT)' })
  async create(
    @Headers() { authorization },
    @Body() body: CreateFormSubmissionDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'post',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: 'form-submissions',
      authorization,
      body,
      res,
    });
  }

  @Patch(':id/data')
  @ApiOperation({ summary: 'Update form submission data (versioned)' })
  @ApiParam({ name: 'id', description: 'Form submission UUID' })
  async updateData(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateFormSubmissionDataDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'patch',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `form-submissions/${id}/data`,
      authorization,
      body,
      res,
    });
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transition: DRAFT → SUBMITTED' })
  @ApiParam({ name: 'id', description: 'Form submission UUID' })
  async submit(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'post',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `form-submissions/${id}/submit`,
      authorization,
      res,
    });
  }

  @Post(':id/start-review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transition: SUBMITTED → UNDER_REVIEW' })
  @ApiParam({ name: 'id', description: 'Form submission UUID' })
  async startReview(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'post',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `form-submissions/${id}/start-review`,
      authorization,
      res,
    });
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transition: UNDER_REVIEW → APPROVED' })
  @ApiParam({ name: 'id', description: 'Form submission UUID' })
  async approve(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'post',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `form-submissions/${id}/approve`,
      authorization,
      res,
    });
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transition: UNDER_REVIEW → REJECTED' })
  @ApiParam({ name: 'id', description: 'Form submission UUID' })
  async reject(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { reason?: string },
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'post',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `form-submissions/${id}/reject`,
      authorization,
      body,
      res,
    });
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transition: any → CANCELLED' })
  @ApiParam({ name: 'id', description: 'Form submission UUID' })
  async cancel(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'post',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `form-submissions/${id}/cancel`,
      authorization,
      res,
    });
  }

  @Post(':id/reopen')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transition: REJECTED → DRAFT (reopen)' })
  @ApiParam({ name: 'id', description: 'Form submission UUID' })
  async reopen(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'post',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `form-submissions/${id}/reopen`,
      authorization,
      res,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update form submission metadata' })
  @ApiParam({ name: 'id', description: 'Form submission UUID' })
  async update(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateFormSubmissionDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'patch',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `form-submissions/${id}`,
      authorization,
      body,
      res,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete form submission' })
  @ApiParam({ name: 'id', description: 'Form submission UUID' })
  async remove(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'delete',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `form-submissions/${id}`,
      authorization,
      res,
    });
  }
}
