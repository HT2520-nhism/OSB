import {
  IsUUID,
  IsOptional,
  IsString,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * PHASE 8 — Create Fishing Trip Crew DTO.
 *
 * Supports TWO identification modes:
 *  1. userId — direct user reference (existing flow)
 *  2. fishermanCode — business identifier (new PHASE 8 flow)
 *
 * fishermanCode is preferred for public API.
 * userId is kept for backward compatibility.
 */
export class CreateFishingTripCrewDto {
  @ApiProperty({ description: 'Fishing trip ID' })
  @IsUUID()
  fishingTripId!: string;

  @ApiPropertyOptional({
    description: 'User ID (direct reference to logboook-identity-api)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Fisherman Code (business identifier - PHASE 8)',
    example: 'FSH-000123',
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  fishermanCode?: string;

  @ApiPropertyOptional({ description: 'Crew role', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  crewRole?: string;

  @ApiPropertyOptional({ description: 'Joined at' })
  @IsOptional()
  @IsDateString()
  joinedAt?: string;

  @ApiPropertyOptional({ description: 'Left at' })
  @IsOptional()
  @IsDateString()
  leftAt?: string;
}
