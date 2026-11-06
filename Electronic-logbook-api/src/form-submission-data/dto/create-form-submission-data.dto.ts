import { IsUUID, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFormSubmissionDataDto {
  @ApiProperty({ description: 'Form submission ID' })
  @IsUUID()
  formSubmissionId!: string;
  @ApiProperty({ description: 'Form data (JSON object)' })
  @IsObject()
  data!: Record<string, unknown>;
}
