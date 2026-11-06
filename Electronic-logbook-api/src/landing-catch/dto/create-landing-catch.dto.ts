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

export class CreateLandingCatchDto {
  @ApiProperty({ description: 'Landing record ID' })
  @IsUUID()
  landingRecordId!: string;

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
}
