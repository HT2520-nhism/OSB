import {
  IsUUID,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueryFishingOperationDto {
  @ApiPropertyOptional({ description: 'Filter by fishing trip ID' })
  @IsOptional()
  @IsUUID()
  fishingTripId?: string;

  @ApiPropertyOptional({ description: 'Filter by operation type' })
  @IsOptional()
  @IsString()
  operationType?: string;

  @ApiPropertyOptional({ description: 'From date (ISO string)' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'To date (ISO string)' })
  @IsOptional()
  @IsDateString()
  to?: string;

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
