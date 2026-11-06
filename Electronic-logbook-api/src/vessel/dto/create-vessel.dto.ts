import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { VesselStatus } from '../../constants/enums/domain.enum';

export class CreateVesselDto {
  @ApiProperty({ description: 'Registration number', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  registrationNumber!: string;

  @ApiPropertyOptional({ description: 'Vessel name', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  vesselName?: string;

  @ApiPropertyOptional({ description: 'Vessel type', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  vesselType?: string;

  @ApiPropertyOptional({
    description: 'Length in meters (decimal)',
    example: 24.5,
    type: Number,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  length?: number;

  @ApiPropertyOptional({
    description: 'Width in meters (decimal)',
    example: 6.8,
    type: Number,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  width?: number;

  @ApiPropertyOptional({
    description: 'Depth in meters (decimal)',
    example: 3.2,
    type: Number,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  depth?: number;

  @ApiPropertyOptional({
    description: 'Gross tonnage (decimal)',
    example: 120,
    type: Number,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  grossTonnage?: number;

  @ApiPropertyOptional({
    description: 'Engine power in kW (decimal)',
    example: 450,
    type: Number,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  enginePower?: number;

  @ApiPropertyOptional({ description: 'Province code', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  provinceCode?: string;

  @ApiPropertyOptional({ description: 'District code', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  districtCode?: string;

  @ApiPropertyOptional({ description: 'Ward code', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  wardCode?: string;

  @ApiPropertyOptional({
    description: 'Vessel status',
    enum: VesselStatus,
    example: 'ACTIVE',
  })
  @IsOptional()
  @IsEnum(VesselStatus)
  status?: VesselStatus;
}
