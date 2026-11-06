/**
 * PHASE 6 — Sync DTOs.
 *
 * Envelope-level validation. Entity-payload validation is delegated to
 * per-entity handlers.
 */

import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { SyncEntityType, SyncOperationType } from '../sync.enum';

export class SyncOperationDto {
  @ApiProperty({ description: 'Globally unique idempotency key' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  operationId!: string;

  @ApiProperty({ enum: SyncEntityType })
  @IsEnum(SyncEntityType)
  entityType!: SyncEntityType;

  @ApiProperty({
    description: 'UUID of the entity. For CREATE may be a pre-generated UUID.',
    format: 'uuid',
  })
  @IsUUID()
  entityId!: string;

  @ApiProperty({ enum: SyncOperationType })
  @IsEnum(SyncOperationType)
  operationType!: SyncOperationType;

  @ApiProperty({
    description: 'Client-side version for optimistic concurrency',
  })
  @IsInt()
  @Min(1)
  clientVersion!: number;

  @ApiPropertyOptional({
    description: 'Entity payload. Shape depends on entityType.',
  })
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}

export class SyncPushDto {
  @ApiProperty({ description: 'Stable device identifier (UUID)' })
  @IsUUID()
  deviceId!: string;

  @ApiProperty({ type: [SyncOperationDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => SyncOperationDto)
  operations!: SyncOperationDto[];
}

export class SyncPullDto {
  @ApiPropertyOptional({
    description: 'Opaque cursor returned by a previous pull',
    maxLength: 1024,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  cursor?: string;

  @ApiPropertyOptional({ description: 'Max batch size', default: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}

export class SyncRegisterDeviceDto {
  @ApiProperty({
    description: 'Stable device identifier generated on the device',
  })
  @IsUUID()
  deviceId!: string;

  @ApiPropertyOptional({ description: 'Platform', maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  platform?: string;

  @ApiPropertyOptional({ description: 'App version', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  appVersion?: string;
}
