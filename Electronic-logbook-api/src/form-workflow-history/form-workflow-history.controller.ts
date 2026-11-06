import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { LogbookJwtAuthGuard } from '../auth/jwt-auth.guard';

import { FormWorkflowHistoryService } from './form-workflow-history.service';

@ApiBearerAuth('user')
@ApiTags('Form_workflow_history')
@UseGuards(LogbookJwtAuthGuard)
@Controller('form-workflow-histories')
export class FormWorkflowHistoryController {
  constructor(private readonly service: FormWorkflowHistoryService) {}

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
