import {
  IsUUID,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreatePortCallDto {
  @ApiProperty({ description: 'Fishing trip ID' })
  @IsUUID()
  fishingTripId!: string;

  @ApiPropertyOptional({ description: 'Port code', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  portCode?: string;

  @ApiPropertyOptional({ description: 'Call type', maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  callType?: string;

  @ApiPropertyOptional({ description: 'Occurrence time' })
  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  @ApiPropertyOptional({
    description: 'Latitude (decimal, precision 7)',
    example: 10.035,
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
    example: 105.787,
    type: Number,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 7 })
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  longitude?: number;

  @ApiPropertyOptional({ description: 'Reason', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;

  @ApiPropertyOptional({ description: 'Notes (text)' })
  @IsOptional()
  @IsString()
  notes?: string;
}
