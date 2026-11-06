/**
 * PHASE 8 — Electronic Logbook · Form Submission Confirmation passthrough.
 *
 * The downstream exposes:
 *   GET  /form-submission-confirmations                   — list
 *   GET  /form-submission-confirmations/remaining/:id     — remaining quantity
 *   GET  /form-submission-confirmations/:id               — one
 *   POST /form-submission-confirmations/:id/confirm       — confirm M01 receipt
 */

import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  HttpCode,
  HttpStatus,
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
import { ConfirmFormSubmissionDto } from './dto';

@ApiTags(SwaggerTags.FORM_SUBMISSION_CONFIRMATION)
@ApiBearerAuth('logbook-user')
@Controller('electronic-logbook/form-submission-confirmations')
export class ElbFormSubmissionConfirmationController {
  @Get()
  @ApiOperation({ summary: 'List form submission confirmations' })
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
      path: 'form-submission-confirmations',
      authorization,
      query,
      res,
    });
  }

  @Get('remaining/:formSubmissionId')
  @ApiOperation({
    summary: 'Compute remaining unconfirmed quantity for a submission',
  })
  @ApiParam({ name: 'formSubmissionId', description: 'Form submission UUID' })
  async remaining(
    @Headers() { authorization },
    @Param('formSubmissionId', ParseUUIDPipe) formSubmissionId: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `form-submission-confirmations/remaining/${formSubmissionId}`,
      authorization,
      res,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get confirmation record by ID' })
  @ApiParam({ name: 'id', description: 'Confirmation UUID' })
  async findOne(
    @Headers() { authorization },
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'get',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `form-submission-confirmations/${id}`,
      authorization,
      res,
    });
  }

  @Post(':formSubmissionId/confirm')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Confirm a previously-issued M01 receipt' })
  @ApiParam({ name: 'formSubmissionId', description: 'Form submission UUID' })
  async confirm(
    @Headers() { authorization },
    @Param('formSubmissionId', ParseUUIDPipe) formSubmissionId: string,
    @Body() body: ConfirmFormSubmissionDto,
    @Res() res,
  ) {
    return forwardToDownstream({
      method: 'post',
      baseUrl: config.ELECTRONIC_LOGBOOK_API_URL,
      path: `form-submission-confirmations/${formSubmissionId}/confirm`,
      authorization,
      body,
      res,
    });
  }
}
