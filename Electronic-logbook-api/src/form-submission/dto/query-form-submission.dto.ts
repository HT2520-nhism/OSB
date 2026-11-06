import { IsUUID, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueryFormSubmissionDto {
  @ApiPropertyOptional({ description: 'Filter by form definition ID' })
  @IsOptional()
  @IsUUID()
  formDefinitionId?: string;

  @ApiPropertyOptional({ description: 'Filter by vessel ID' })
  @IsOptional()
  @IsUUID()
  vesselId?: string;

  @ApiPropertyOptional({ description: 'Filter by fishing trip ID' })
  @IsOptional()
  @IsUUID()
  fishingTripId?: string;

  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
