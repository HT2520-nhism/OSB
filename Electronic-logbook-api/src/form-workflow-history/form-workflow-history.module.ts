import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FormWorkflowHistory } from './form-workflow-history.entity';
import { FormWorkflowHistoryController } from './form-workflow-history.controller';
import { FormWorkflowHistoryService } from './form-workflow-history.service';

@Module({
  imports: [TypeOrmModule.forFeature([FormWorkflowHistory])],
  controllers: [FormWorkflowHistoryController],
  providers: [FormWorkflowHistoryService],
  exports: [FormWorkflowHistoryService],
})
export class FormWorkflowHistoryModule {}
