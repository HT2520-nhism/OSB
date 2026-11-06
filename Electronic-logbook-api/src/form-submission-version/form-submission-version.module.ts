import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FormSubmissionVersion } from './form-submission-version.entity';
import { FormSubmissionVersionController } from './form-submission-version.controller';
import { FormSubmissionVersionService } from './form-submission-version.service';

@Module({
  imports: [TypeOrmModule.forFeature([FormSubmissionVersion])],
  controllers: [FormSubmissionVersionController],
  providers: [FormSubmissionVersionService],
  exports: [FormSubmissionVersionService],
})
export class FormSubmissionVersionModule {}
