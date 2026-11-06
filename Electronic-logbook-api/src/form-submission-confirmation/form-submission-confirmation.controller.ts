import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { LogbookJwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';

import { FormSubmissionConfirmationService } from './form-submission-confirmation.service';

@ApiBearerAuth('user')
@ApiTags('Form_submission_confirmation')
@UseGuards(LogbookJwtAuthGuard)
@Controller('form-submission-confirmations')
export class FormSubmissionConfirmationController {
  constructor(private readonly service: FormSubmissionConfirmationService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('remaining/:formSubmissionId')
  remaining(
    @Param('formSubmissionId', ParseUUIDPipe) formSubmissionId: string,
  ) {
    return this.service.computeRemainingQuantity(formSubmissionId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  /**
   * Confirm a previously-issued Mẫu 01 receipt.
   * Records the authenticated user, IP, and user-agent from the request.
   */
  @Post(':formSubmissionId/confirm')
  confirm(
    @Param('formSubmissionId', ParseUUIDPipe) formSubmissionId: string,
    @Body()
    body: {
      issuanceDate?: string;
      confirmedQuantity: string;
      buyerName?: string;
      buyerOrganization?: string;
      buyerAddress?: string;
      notes?: string;
    },
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || null;
    const ua = (req.headers['user-agent'] as string) || null;
    return this.service.confirm(
      formSubmissionId,
      {
        issuanceDate: body.issuanceDate,
        confirmedQuantity: body.confirmedQuantity,
        buyerName: body.buyerName,
        buyerOrganization: body.buyerOrganization,
        buyerAddress: body.buyerAddress,
        notes: body.notes,
      },
      user,
      ip,
      ua,
    );
  }
}
