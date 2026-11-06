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

export class CreateFishingTripGearDto {
  @ApiProperty({ description: 'Fishing trip ID' })
  @IsUUID()
  fishingTripId!: string;

  @ApiPropertyOptional({ description: 'Fishing gear ID' })
  @IsOptional()
  @IsUUID()
  fishingGearId?: string;

  @ApiPropertyOptional({ description: 'Gear type', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  gearType?: string;

  @ApiPropertyOptional({
    description: 'Quantity (decimal)',
    example: 2,
    type: Number,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  quantity?: number;
}
