import {
  IsUUID,
  IsOptional,
  IsString,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFishingGearDto {
  @ApiPropertyOptional({ description: 'Vessel ID' })
  @IsOptional()
  @IsUUID()
  vesselId?: string;
  @ApiProperty({ description: 'Gear name', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;
  @ApiPropertyOptional({ description: 'Gear type', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  gearType?: string;
  @ApiPropertyOptional({ description: 'Description (text)' })
  @IsOptional()
  @IsString()
  description?: string;
}
