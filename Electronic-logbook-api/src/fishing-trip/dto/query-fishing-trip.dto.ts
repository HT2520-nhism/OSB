import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueryFishingTripDto {
  @ApiPropertyOptional({ description: 'Filter by vessel ID' })
  @IsOptional()
  @IsUUID()
  vesselId?: string;

  @ApiPropertyOptional({ description: 'Filter by creator user ID' })
  @IsOptional()
  @IsUUID()
  createdBy?: string;

  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by submission status' })
  @IsOptional()
  @IsString()
  submissionStatus?: string;

  @ApiPropertyOptional({ description: 'Filter by trip number' })
  @IsOptional()
  @IsString()
  tripNumber?: string;

  @ApiPropertyOptional({ description: 'Departure from date (ISO string)' })
  @IsOptional()
  @IsDateString()
  departureFrom?: string;

  @ApiPropertyOptional({ description: 'Departure to date (ISO string)' })
  @IsOptional()
  @IsDateString()
  departureTo?: string;

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
