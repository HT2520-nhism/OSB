import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FormSubmissionConfirmation } from './form-submission-confirmation.entity';
import { FormSubmissionConfirmationController } from './form-submission-confirmation.controller';
import { FormSubmissionConfirmationService } from './form-submission-confirmation.service';
import { FormSubmission } from '../form-submission/form-submission.entity';
import { FormSubmissionData } from '../form-submission-data/form-submission-data.entity';
import { DomainEventsModule } from '../domain-events/domain-events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FormSubmissionConfirmation,
      FormSubmission,
      FormSubmissionData,
    ]),
    DomainEventsModule,
  ],
  controllers: [FormSubmissionConfirmationController],
  providers: [FormSubmissionConfirmationService],
  exports: [FormSubmissionConfirmationService],
})
export class FormSubmissionConfirmationModule {}
