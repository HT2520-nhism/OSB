/**
 * PHASE 8 — Document DTOs.
 */

import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UploadDocumentDto {
  @ApiProperty({
    description: 'Owner entity type (e.g. "vessel", "fishing_trip")',
  })
  @IsString()
  @IsOptional()
  ownerType?: string;

  @ApiProperty({ description: 'Owner entity ID' })
  @IsString()
  @IsOptional()
  ownerId?: string;

  @ApiPropertyOptional({
    description: 'Document type (e.g. "license", "certificate")',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  documentType?: string;
}

export class QueryDocumentDto {
  @ApiPropertyOptional({ description: 'Filter by owner entity type' })
  @IsOptional()
  @IsString()
  ownerType?: string;

  @ApiPropertyOptional({ description: 'Filter by owner entity ID' })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional({ description: 'Filter by document type' })
  @IsOptional()
  @IsString()
  documentType?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
