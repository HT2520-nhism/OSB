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

export class CreateFuelRecordDto {
  @ApiProperty({ description: 'Fishing trip ID' })
  @IsUUID()
  fishingTripId!: string;

  @ApiPropertyOptional({ description: 'Record type', maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  recordType?: string;

  @ApiPropertyOptional({
    description: 'Quantity in liters (decimal)',
    example: 800.5,
    type: Number,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Type(() => Number)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Unit', maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  unit?: string;

  @ApiPropertyOptional({ description: 'Occurrence time' })
  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  @ApiPropertyOptional({ description: 'Location', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({ description: 'Notes (text)' })
  @IsOptional()
  @IsString()
  notes?: string;
}
