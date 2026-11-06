import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RejectFormSubmissionDto {
  @ApiPropertyOptional({
    description: 'Reason for rejection (recorded on workflow history)',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
