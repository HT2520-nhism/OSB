import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FormSubmission } from './form-submission.entity';
import { FormSubmissionController } from './form-submission.controller';
import { FormSubmissionService } from './form-submission.service';
import { FormSubmissionData } from '../form-submission-data/form-submission-data.entity';
import { FormSubmissionVersion } from '../form-submission-version/form-submission-version.entity';
import { FormWorkflowHistory } from '../form-workflow-history/form-workflow-history.entity';
import { FormDefinition } from '../form-definition/form-definition.entity';
import { Vessel } from '../vessel/vessel.entity';
import { FishingTrip } from '../fishing-trip/fishing-trip.entity';
import { DomainEventsModule } from '../domain-events/domain-events.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FormSubmission,
      FormSubmissionData,
      FormSubmissionVersion,
      FormWorkflowHistory,
      FormDefinition,
      Vessel,
      FishingTrip,
    ]),
    DomainEventsModule,
    AuthModule,
  ],
  controllers: [FormSubmissionController],
  providers: [FormSubmissionService],
  exports: [FormSubmissionService],
})
export class FormSubmissionModule {}
