import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFormSubmissionDataDto {
  @ApiPropertyOptional({
    description:
      'Form data (JSON object). Stored as JSONB in form_submission_data.data. ' +
      'Recorded as a new version (FormSubmissionVersion) on each update.',
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Reason for this data update (recorded in version history)',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  changeReason?: string;
}
