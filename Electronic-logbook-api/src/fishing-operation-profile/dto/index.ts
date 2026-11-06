/**
 * PHASE 8 — DTOs for Fishing Operation Profile.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsString, IsIn, MaxLength } from 'class-validator';

/**
 * Internal DTO for creating a profile.
 * fishermanCode is generated server-side — NOT accepted from client.
 */
export class CreateFishingOperationProfileDto {
  @ApiProperty({
    description: 'User ID (logical reference to logboook-identity-api)',
  })
  @IsUUID()
  userId!: string;

  @ApiPropertyOptional({
    description: 'Status (default: ACTIVE)',
    enum: ['ACTIVE', 'INACTIVE'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: string;
}

/**
 * Search query for fishermen.
 * Accepts fishermanCode for exact match.
 * Does NOT accept CCCD, citizenId, or sensitive data.
 */
export class SearchFishingOperationProfileDto {
  @ApiPropertyOptional({
    description: 'Search by fisherman code (exact match)',
    example: 'FSH-000123',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  fishermanCode?: string;

  @ApiPropertyOptional({
    description: 'Search by user ID (exact match)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ['ACTIVE', 'INACTIVE'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: string;
}

/**
 * Response DTO — minimal public data.
 * Does NOT expose CCCD, DOB, full address, or sensitive info.
 */
export class FishingOperationProfileResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id!: string;

  @ApiProperty({ example: 'FSH-000123' })
  fishermanCode!: string;

  @ApiPropertyOptional({ example: 'uuid-of-user' })
  userId?: string;

  @ApiProperty({ example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE'] })
  status!: string;

  @ApiProperty()
  createdAt!: string;
}
