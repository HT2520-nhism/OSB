import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { LogbookJwtAuthGuard } from '../auth/jwt-auth.guard';

import { FormSubmissionDataService } from './form-submission-data.service';

@ApiBearerAuth('user')
@ApiTags('Form_submission_data')
@UseGuards(LogbookJwtAuthGuard)
@Controller('form-submission-data')
export class FormSubmissionDataController {
  constructor(private readonly service: FormSubmissionDataService) {}

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
