import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FormSubmissionData } from './form-submission-data.entity';
import { FormSubmissionDataController } from './form-submission-data.controller';
import { FormSubmissionDataService } from './form-submission-data.service';
import { FormSubmission } from '../form-submission/form-submission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FormSubmissionData, FormSubmission])],
  controllers: [FormSubmissionDataController],
  providers: [FormSubmissionDataService],
  exports: [FormSubmissionDataService],
})
export class FormSubmissionDataModule {}
