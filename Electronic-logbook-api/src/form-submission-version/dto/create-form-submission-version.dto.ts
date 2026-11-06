import {
  IsUUID,
  IsOptional,
  IsString,
  IsObject,
  IsInt,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFormSubmissionVersionDto {
  @ApiProperty({ description: 'Form submission ID' })
  @IsUUID()
  formSubmissionId!: string;
  @ApiProperty({ description: 'Form data (JSON object)' })
  @IsObject()
  data!: Record<string, unknown>;
  @ApiPropertyOptional({ description: 'Change reason', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  changeReason?: string;
}
