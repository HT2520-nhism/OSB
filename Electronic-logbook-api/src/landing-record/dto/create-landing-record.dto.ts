import {
  IsUUID,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateLandingRecordDto {
  @ApiProperty({ description: 'Fishing trip ID' })
  @IsUUID()
  fishingTripId!: string;

  @ApiPropertyOptional({ description: 'Landing port code', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  landingPortCode?: string;

  @ApiPropertyOptional({ description: 'Landed at' })
  @IsOptional()
  @IsDateString()
  landedAt?: string;

  @ApiPropertyOptional({
    description: 'Total quantity in kg (decimal)',
    example: 350.5,
    type: Number,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Type(() => Number)
  totalQuantity?: number;

  @ApiPropertyOptional({ description: 'Notes (text)' })
  @IsOptional()
  @IsString()
  notes?: string;
}
