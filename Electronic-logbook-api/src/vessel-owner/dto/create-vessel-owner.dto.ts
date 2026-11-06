import {
  IsUUID,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVesselOwnerDto {
  @ApiProperty({ description: 'Vessel ID' })
  @IsUUID()
  vesselId!: string;
  @ApiProperty({ description: 'User ID (Identity reference)' })
  @IsUUID()
  userId!: string;
  @ApiPropertyOptional({ description: 'Ownership type', maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  ownershipType?: string;
  @ApiPropertyOptional({ description: 'Ownership start date' })
  @IsOptional()
  @IsDateString()
  startedAt?: string;
  @ApiPropertyOptional({ description: 'Ownership end date' })
  @IsOptional()
  @IsDateString()
  endedAt?: string;
  @ApiPropertyOptional({ description: 'Is current ownership' })
  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;
}
