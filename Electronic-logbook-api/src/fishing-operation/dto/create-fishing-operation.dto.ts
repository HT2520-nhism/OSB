import {
  IsUUID,
  IsOptional,
  IsNumber,
  IsDateString,
  IsString,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateFishingOperationDto {
  @ApiProperty({ description: 'Fishing trip ID' })
  @IsUUID()
  fishingTripId!: string;

  @ApiPropertyOptional({
    description: 'Latitude (decimal, precision 7)',
    example: 9.5234567,
    type: Number,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 7 })
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude (decimal, precision 7)',
    example: 104.1234567,
    type: Number,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 7 })
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  longitude?: number;

  @ApiPropertyOptional({ description: 'Operation start time' })
  @IsOptional()
  @IsDateString()
  operationStartedAt?: string;

  @ApiPropertyOptional({ description: 'Operation end time' })
  @IsOptional()
  @IsDateString()
  operationEndedAt?: string;

  @ApiPropertyOptional({ description: 'Operation type', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  operationType?: string;

  @ApiPropertyOptional({ description: 'Fishing gear type', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fishingGearType?: string;

  @ApiPropertyOptional({ description: 'Fishing ground', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fishingGround?: string;

  @ApiPropertyOptional({
    description: 'Depth in meters (decimal)',
    example: 45.0,
    type: Number,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  depth?: number;

  @ApiPropertyOptional({ description: 'Notes (text)' })
  @IsOptional()
  @IsString()
  notes?: string;
}
