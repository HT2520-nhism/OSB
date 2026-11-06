import { IsUUID, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFormWorkflowHistoryDto {
  @ApiProperty({ description: 'Form submission ID' })
  @IsUUID()
  formSubmissionId!: string;
  @ApiPropertyOptional({ description: 'From status', maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  fromStatus?: string;
  @ApiPropertyOptional({ description: 'To status', maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  toStatus?: string;
  @ApiPropertyOptional({ description: 'Action', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  action?: string;
  @ApiPropertyOptional({ description: 'Reason (text)' })
  @IsOptional()
  @IsString()
  reason?: string;
}
