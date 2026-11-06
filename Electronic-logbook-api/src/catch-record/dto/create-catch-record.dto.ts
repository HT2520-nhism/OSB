import {
  IsUUID,
  IsOptional,
  IsString,
  IsNumber,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCatchRecordDto {
  @ApiProperty({ description: 'Fishing operation ID' })
  @IsUUID()
  fishingOperationId!: string;

  @ApiPropertyOptional({ description: 'Species code', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  speciesCode?: string;

  @ApiPropertyOptional({ description: 'Species name', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  speciesName?: string;

  @ApiPropertyOptional({
    description: 'Quantity in kg (decimal)',
    example: 150.5,
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

  @ApiPropertyOptional({
    description: 'Estimated quantity in kg (decimal)',
    example: 160.0,
    type: Number,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Type(() => Number)
  estimatedQuantity?: number;

  @ApiPropertyOptional({ description: 'Condition', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  condition?: string;

  @ApiPropertyOptional({ description: 'Notes (text)' })
  @IsOptional()
  @IsString()
  notes?: string;
}
