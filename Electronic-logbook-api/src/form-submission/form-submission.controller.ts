import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { LogbookJwtAuthGuard } from '../auth/jwt-auth.guard';
import { SystemRoleGuard, RequireSystemRole } from '../auth/system-role.guard';
import { SystemRole } from '../constants/enums/system-role.enum';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';

import { FormSubmissionService } from './form-submission.service';
import {
  CreateFormSubmissionDto,
  UpdateFormSubmissionDto,
  QueryFormSubmissionDto,
  RejectFormSubmissionDto,
} from './dto';
import { UpdateFormSubmissionDataDto } from '../form-submission-data/dto/update-form-submission-data.dto';

import { FormSubmissionStatus } from '../constants/enums/domain.enum';

@ApiBearerAuth('user')
@ApiTags('Form_submission')
@UseGuards(LogbookJwtAuthGuard)
@Controller('form-submissions')
export class FormSubmissionController {
  constructor(private readonly service: FormSubmissionService) {}

  @Get()
  findAll(@Query() query: QueryFormSubmissionDto) {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateFormSubmissionDto, @CurrentUser() user: AuthUser) {
    return this.service.createForm(
      {
        formDefinitionId: dto.formDefinitionId,
        vesselId: dto.vesselId,
        fishingTripId: dto.fishingTripId ?? null,
        status: dto.status,
        data: dto.data,
      },
      user,
    );
  }

  @Patch(':id/data')
  updateData(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateFormSubmissionDataDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.updateFormData(
      id,
      body.data ?? {},
      body.changeReason ?? null,
      user,
    );
  }

  @Post(':id/submit')
  submit(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.transition(id, FormSubmissionStatus.SUBMITTED, user);
  }

  @Post(':id/start-review')
  @UseGuards(SystemRoleGuard)
  @RequireSystemRole(SystemRole.ADMIN, SystemRole.OPERATOR, SystemRole.SUPER_ADMIN)
  startReview(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.transition(id, FormSubmissionStatus.UNDER_REVIEW, user);
  }

  @Post(':id/approve')
  @UseGuards(SystemRoleGuard)
  @RequireSystemRole(SystemRole.ADMIN, SystemRole.OPERATOR, SystemRole.SUPER_ADMIN)
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.transition(id, FormSubmissionStatus.APPROVED, user);
  }

  @Post(':id/reject')
  @UseGuards(SystemRoleGuard)
  @RequireSystemRole(SystemRole.ADMIN, SystemRole.OPERATOR, SystemRole.SUPER_ADMIN)
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: RejectFormSubmissionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.transition(
      id,
      FormSubmissionStatus.REJECTED,
      user,
      body.reason ?? null,
    );
  }

  @Post(':id/cancel')
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.transition(id, FormSubmissionStatus.CANCELLED, user);
  }

  @Post(':id/reopen')
  reopen(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.transition(
      id,
      FormSubmissionStatus.DRAFT,
      user,
      'reopen after rejection',
    );
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFormSubmissionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.update(
      id,
      dto as Partial<import('./form-submission.entity').FormSubmission>,
      user,
    );
  }

  @Delete(':id')
  @UseGuards(SystemRoleGuard)
  @RequireSystemRole(SystemRole.ADMIN, SystemRole.SUPER_ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
