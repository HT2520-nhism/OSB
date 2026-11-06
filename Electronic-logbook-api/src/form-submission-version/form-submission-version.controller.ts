import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { LogbookJwtAuthGuard } from '../auth/jwt-auth.guard';

import { FormSubmissionVersionService } from './form-submission-version.service';

@ApiBearerAuth('user')
@ApiTags('Form_submission_version')
@UseGuards(LogbookJwtAuthGuard)
@Controller('form-submission-versions')
export class FormSubmissionVersionController {
  constructor(private readonly service: FormSubmissionVersionService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('by-submission/:formSubmissionId')
  findBySubmissionId(
    @Param('formSubmissionId', ParseUUIDPipe) formSubmissionId: string,
  ) {
    return this.service.findBySubmissionId(formSubmissionId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }
}
