import { PartialType } from '@nestjs/mapped-types';
import { CreateFormSubmissionVersionDto } from './create-form-submission-version.dto';

export class UpdateFormSubmissionVersionDto extends PartialType(
  CreateFormSubmissionVersionDto,
) {}
