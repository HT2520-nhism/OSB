import {
  IsUUID,
  IsOptional,
  IsString,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFishingTripDto {
  @ApiProperty({ description: 'Vessel ID' })
  @IsUUID()
  vesselId!: string;
  @ApiPropertyOptional({ description: 'Trip number', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  tripNumber?: string;
  @ApiPropertyOptional({ description: 'Departure port code', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  departurePortCode?: string;
  @ApiPropertyOptional({ description: 'Arrival port code', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  arrivalPortCode?: string;
  @ApiPropertyOptional({ description: 'Departure time' })
  @IsOptional()
  @IsDateString()
  departureAt?: string;
  @ApiPropertyOptional({ description: 'Arrival time' })
  @IsOptional()
  @IsDateString()
  arrivalAt?: string;
}
