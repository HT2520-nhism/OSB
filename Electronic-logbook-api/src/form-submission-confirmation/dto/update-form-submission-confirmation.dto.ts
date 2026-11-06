import { PartialType } from '@nestjs/mapped-types';
import { CreateFormSubmissionConfirmationDto } from './create-form-submission-confirmation.dto';

export class UpdateFormSubmissionConfirmationDto extends PartialType(
  CreateFormSubmissionConfirmationDto,
) {}
