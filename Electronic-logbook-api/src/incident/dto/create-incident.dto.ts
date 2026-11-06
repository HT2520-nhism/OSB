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

export class CreateIncidentDto {
  @ApiPropertyOptional({ description: 'Fishing trip ID (optional)' })
  @IsOptional()
  @IsUUID()
  fishingTripId?: string;

  @ApiProperty({ description: 'Vessel ID' })
  @IsUUID()
  vesselId!: string;

  @ApiPropertyOptional({ description: 'Incident type', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  incidentType?: string;

  @ApiPropertyOptional({ description: 'Severity', maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  severity?: string;

  @ApiPropertyOptional({ description: 'Occurrence time' })
  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  @ApiPropertyOptional({
    description: 'Latitude (decimal, precision 7)',
    example: 9.6,
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
    example: 104.18,
    type: Number,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 7 })
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  longitude?: number;

  @ApiPropertyOptional({ description: 'Description (text)' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Action taken (text)' })
  @IsOptional()
  @IsString()
  actionTaken?: string;
}
