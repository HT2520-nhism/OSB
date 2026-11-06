/**
 * PHASE 8 — Electronic Logbook DTOs (re-exported from downstream schemas).
 * Copied verbatim so the Gateway can reference them as types for Swagger schemas
 * without a direct package dependency on the eLogbook service.
 *
 * When the eLogbook service ships these as a shared library, replace this
 * file with a re-export from the library.
 */

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsNumber,
  IsArray,
  IsObject,
  IsEnum,
  IsUUID,
  IsBoolean,
  MaxLength,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ─── Sync ────────────────────────────────────────────────────────────────

export enum SyncEntityType {
  VESSEL = 'VESSEL',
  FISHING_TRIP = 'FISHING_TRIP',
  FISHING_OPERATION = 'FISHING_OPERATION',
  CATCH_RECORD = 'CATCH_RECORD',
  LANDING_RECORD = 'LANDING_RECORD',
  LANDING_CATCH = 'LANDING_CATCH',
  PORT_CALL = 'PORT_CALL',
  INCIDENT = 'INCIDENT',
  FUEL_RECORD = 'FUEL_RECORD',
  FORM_SUBMISSION = 'FORM_SUBMISSION',
  ATTACHMENT = 'ATTACHMENT',
}

export enum SyncOperationType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export class SyncOperationDto {
  @ApiProperty({ description: 'Globally unique idempotency key' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  operationId!: string;

  @ApiProperty({ enum: SyncEntityType })
  @IsEnum(SyncEntityType)
  entityType!: SyncEntityType;

  @ApiProperty({ description: 'UUID of the entity', format: 'uuid' })
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
    description: 'Opaque cursor from previous pull',
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
  @ApiProperty({ description: 'Device UUID generated on the device' })
  @IsUUID()
  deviceId!: string;

  @ApiPropertyOptional({
    description: 'Platform (ios/android/web)',
    maxLength: 30,
  })
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

// ─── Sync Operation ───────────────────────────────────────────────────────

export class CreateSyncOperationDto {
  @ApiProperty({
    description: 'Operation ID (client-generated)',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  operationId!: string;

  @ApiPropertyOptional({ description: 'Entity type', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  entityType?: string;

  @ApiPropertyOptional({ description: 'Entity ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional({
    description: 'Operation type (CREATE/UPDATE/DELETE)',
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  operationType?: string;

  @ApiPropertyOptional({ description: 'Payload (JSON object)' })
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Client version number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  clientVersion?: number | null;
}

export class UpdateSyncOperationDto {
  @ApiPropertyOptional({ description: 'Entity type', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  entityType?: string;

  @ApiPropertyOptional({ description: 'Entity ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional({ description: 'Operation type', maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  operationType?: string;

  @ApiPropertyOptional({ description: 'Payload' })
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Client version' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  clientVersion?: number | null;
}

export class QuerySyncOperationDto {
  @ApiPropertyOptional({ description: 'Filter by device ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  deviceId?: string;

  @ApiPropertyOptional({ description: 'Filter by entity type' })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({ description: 'Filter by operation type' })
  @IsOptional()
  @IsString()
  operationType?: string;

  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

// ─── Sync Conflict ───────────────────────────────────────────────────────

export class CreateSyncConflictDto {
  @ApiProperty({ description: 'Sync operation ID', format: 'uuid' })
  @IsUUID()
  syncOperationId!: string;

  @ApiPropertyOptional({ description: 'Entity type', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  entityType?: string;

  @ApiPropertyOptional({ description: 'Entity ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional({ description: 'Client data (JSON object)' })
  @IsOptional()
  @IsObject()
  clientData?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Server data (JSON object)' })
  @IsOptional()
  @IsObject()
  serverData?: Record<string, unknown>;
}

export class UpdateSyncConflictDto {
  @ApiPropertyOptional({ description: 'Entity type', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  entityType?: string;

  @ApiPropertyOptional({ description: 'Entity ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional({ description: 'Client data' })
  @IsOptional()
  @IsObject()
  clientData?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Server data' })
  @IsOptional()
  @IsObject()
  serverData?: Record<string, unknown>;
}

export class QuerySyncConflictDto {
  @ApiPropertyOptional({
    description: 'Filter by sync operation ID',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  syncOperationId?: string;

  @ApiPropertyOptional({ description: 'Filter by entity type' })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({ description: 'Filter by resolution status' })
  @IsOptional()
  @IsString()
  resolution?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

// ─── Vessel ───────────────────────────────────────────────────────────────

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
    description: 'Vessel status (required before creating fishing trips)',
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DECOMMISSIONED'],
    example: 'ACTIVE',
  })
  @IsOptional()
  @IsString()
  @IsEnum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DECOMMISSIONED'])
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DECOMMISSIONED';
}

export class UpdateVesselDto {
  @ApiPropertyOptional({ description: 'Registration number', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  registrationNumber?: string;

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
    description: 'Vessel status (required before creating fishing trips)',
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DECOMMISSIONED'],
    example: 'ACTIVE',
  })
  @IsOptional()
  @IsString()
  @IsEnum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DECOMMISSIONED'])
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DECOMMISSIONED';
}

export class QueryVesselDto {
  @ApiPropertyOptional({ description: 'Search by name or registration number' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by province code' })
  @IsOptional()
  @IsString()
  provinceCode?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

// ─── Vessel Owner ──────────────────────────────────────────────────────────

export class CreateVesselOwnerDto {
  @ApiProperty({ description: 'Vessel ID', format: 'uuid' })
  @IsUUID()
  vesselId!: string;

  @ApiProperty({ description: 'User ID (Identity reference)', format: 'uuid' })
  @IsUUID()
  userId!: string;

  @ApiPropertyOptional({ description: 'Ownership type', maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  ownershipType?: string;

  @ApiPropertyOptional({ description: 'Ownership start date' })
  @IsOptional()
  @IsString()
  startedAt?: string;

  @ApiPropertyOptional({ description: 'Ownership end date' })
  @IsOptional()
  @IsString()
  endedAt?: string;

  @ApiPropertyOptional({ description: 'Is current ownership' })
  @IsOptional()
  @IsString()
  isCurrent?: boolean;
}

export class UpdateVesselOwnerDto {
  @ApiPropertyOptional({ description: 'Vessel ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  vesselId?: string;

  @ApiPropertyOptional({ description: 'User ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Ownership type', maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  ownershipType?: string;

  @ApiPropertyOptional({ description: 'Ownership start date' })
  @IsOptional()
  @IsString()
  startedAt?: string;

  @ApiPropertyOptional({ description: 'Ownership end date' })
  @IsOptional()
  @IsString()
  endedAt?: string;

  @ApiPropertyOptional({ description: 'Is current ownership' })
  @IsOptional()
  @IsString()
  isCurrent?: boolean;
}

export class QueryVesselOwnerDto {
  @ApiPropertyOptional({ description: 'Filter by vessel ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  vesselId?: string;

  @ApiPropertyOptional({ description: 'Filter by user ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by ownership type' })
  @IsOptional()
  @IsString()
  ownershipType?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

// ─── Vessel Crew ──────────────────────────────────────────────────────────

export class CreateVesselCrewDto {
  @ApiProperty({ description: 'Vessel ID', format: 'uuid' })
  @IsUUID()
  vesselId!: string;

  @ApiPropertyOptional({
    description: 'User ID (Identity reference)',
    format: 'uuid',
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

  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsString()
  startedAt?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsString()
  endedAt?: string;

  @ApiPropertyOptional({ description: 'Is active' })
  @IsOptional()
  @IsString()
  isActive?: boolean;
}

export class UpdateVesselCrewDto {
  @ApiPropertyOptional({ description: 'Vessel ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  vesselId?: string;

  @ApiPropertyOptional({ description: 'User ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Crew role', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  crewRole?: string;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsString()
  startedAt?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsString()
  endedAt?: string;

  @ApiPropertyOptional({ description: 'Is active' })
  @IsOptional()
  @IsString()
  isActive?: boolean;
}

export class QueryVesselCrewDto {
  @ApiPropertyOptional({ description: 'Filter by vessel ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  vesselId?: string;

  @ApiPropertyOptional({ description: 'Filter by user ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by crew role' })
  @IsOptional()
  @IsString()
  crewRole?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

// ─── Port Call ────────────────────────────────────────────────────────────

export class CreatePortCallDto {
  @ApiProperty({ description: 'Fishing trip ID', format: 'uuid' })
  @IsUUID()
  fishingTripId!: string;

  @ApiPropertyOptional({ description: 'Port code', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  portCode?: string;

  @ApiPropertyOptional({ description: 'Call type', maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  callType?: string;

  @ApiPropertyOptional({ description: 'Occurrence time' })
  @IsOptional()
  @IsString()
  occurredAt?: string;

  @ApiPropertyOptional({
    description: 'Latitude (decimal, precision 7)',
    example: 10.035,
    type: Number,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 7 })
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude (decimal, precision 7)',
    example: 105.787,
    type: Number,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 7 })
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  longitude?: number;

  @ApiPropertyOptional({ description: 'Reason', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;

  @ApiPropertyOptional({ description: 'Notes (text)' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePortCallDto extends PartialType(CreatePortCallDto) {}

export class QueryPortCallDto {
  @ApiPropertyOptional({
    description: 'Filter by fishing trip ID',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  fishingTripId?: string;

  @ApiPropertyOptional({ description: 'Filter by port code' })
  @IsOptional()
  @IsString()
  portCode?: string;

  @ApiPropertyOptional({ description: 'Filter by call type' })
  @IsOptional()
  @IsString()
  callType?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

// ─── Landing Record ────────────────────────────────────────────────────────

export class CreateLandingRecordDto {
  @ApiProperty({ description: 'Fishing trip ID', format: 'uuid' })
  @IsUUID()
  fishingTripId!: string;

  @ApiPropertyOptional({ description: 'Landing port code', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  landingPortCode?: string;

  @ApiPropertyOptional({ description: 'Landed at' })
  @IsOptional()
  @IsString()
  landedAt?: string;

  @ApiPropertyOptional({
    description: 'Total quantity in kg (decimal)',
    example: 350.5,
    type: Number,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Type(() => Number)
  totalQuantity?: number;

  @ApiPropertyOptional({ description: 'Notes (text)' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateLandingRecordDto extends PartialType(
  CreateLandingRecordDto,
) {}

export class QueryLandingRecordDto {
  @ApiPropertyOptional({
    description: 'Filter by fishing trip ID',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  fishingTripId?: string;

  @ApiPropertyOptional({ description: 'Filter by landing port code' })
  @IsOptional()
  @IsString()
  landingPortCode?: string;

  @ApiPropertyOptional({ description: 'From date (ISO string)' })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ description: 'To date (ISO string)' })
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

// ─── Landing Catch ────────────────────────────────────────────────────────

export class CreateLandingCatchDto {
  @ApiProperty({ description: 'Landing record ID', format: 'uuid' })
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

export class UpdateLandingCatchDto extends PartialType(CreateLandingCatchDto) {}

export class QueryLandingCatchDto {
  @ApiPropertyOptional({
    description: 'Filter by landing record ID',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  landingRecordId?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

// ─── Incident ─────────────────────────────────────────────────────────────

export class CreateIncidentDto {
  @ApiPropertyOptional({
    description: 'Fishing trip ID (optional)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  fishingTripId?: string;

  @ApiProperty({ description: 'Vessel ID', format: 'uuid' })
  @IsUUID()
  vesselId!: string;

  @ApiPropertyOptional({ description: 'Incident type', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  incidentType?: string;

  @ApiPropertyOptional({ description: 'Severity', maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  severity?: string;

  @ApiPropertyOptional({ description: 'Occurrence time' })
  @IsOptional()
  @IsString()
  occurredAt?: string;

  @ApiPropertyOptional({
    description: 'Latitude (decimal, precision 7)',
    example: 9.6,
    type: Number,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 7 })
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude (decimal, precision 7)',
    example: 104.18,
    type: Number,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 7 })
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  longitude?: number;

  @ApiPropertyOptional({ description: 'Description (text)' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Action taken (text)' })
  @IsOptional()
  @IsString()
  actionTaken?: string;
}

export class UpdateIncidentDto extends PartialType(CreateIncidentDto) {}

export class QueryIncidentDto {
  @ApiPropertyOptional({ description: 'Filter by vessel ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  vesselId?: string;

  @ApiPropertyOptional({
    description: 'Filter by fishing trip ID',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  fishingTripId?: string;

  @ApiPropertyOptional({ description: 'Filter by incident type' })
  @IsOptional()
  @IsString()
  incidentType?: string;

  @ApiPropertyOptional({ description: 'Filter by severity' })
  @IsOptional()
  @IsString()
  severity?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

// ─── Fuel Record ──────────────────────────────────────────────────────────

export class CreateFuelRecordDto {
  @ApiProperty({ description: 'Fishing trip ID', format: 'uuid' })
  @IsUUID()
  fishingTripId!: string;

  @ApiPropertyOptional({ description: 'Record type', maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  recordType?: string;

  @ApiPropertyOptional({
    description: 'Quantity in liters (decimal)',
    example: 800.5,
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

  @ApiPropertyOptional({ description: 'Occurrence time' })
  @IsOptional()
  @IsString()
  occurredAt?: string;

  @ApiPropertyOptional({ description: 'Location', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({ description: 'Notes (text)' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateFuelRecordDto extends PartialType(CreateFuelRecordDto) {}

export class QueryFuelRecordDto {
  @ApiPropertyOptional({
    description: 'Filter by fishing trip ID',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  fishingTripId?: string;

  @ApiPropertyOptional({ description: 'Filter by record type' })
  @IsOptional()
  @IsString()
  recordType?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

// ─── Form Submission ───────────────────────────────────────────────────────

export class CreateFormSubmissionDto {
  @ApiProperty({ description: 'Form definition ID', format: 'uuid' })
  @IsUUID()
  formDefinitionId!: string;

  @ApiPropertyOptional({
    description: 'Fishing trip ID (optional)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  fishingTripId?: string;

  @ApiProperty({ description: 'Vessel ID', format: 'uuid' })
  @IsUUID()
  vesselId!: string;

  /**
   * Form-specific payload (M01/M02/M03 fields, regulatory data, etc.).
   * Stored as JSONB in the downstream service's form_submission_data table.
   *
   * NOTE: Gateway does NOT run a global ValidationPipe, so this field
   * is not strictly required for transport. Declaring it here for
   * Swagger accuracy and forward-compatibility with the downstream
   * service's CreateFormSubmissionDto (which DOES validate this field).
   */
  @ApiProperty({
    description:
      'Form data payload (M01/M02/M03 fields). Must be a plain JSON object.',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  data?: Record<string, unknown>;
}

export class UpdateFormSubmissionDto {
  @ApiPropertyOptional({ description: 'Form definition ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  formDefinitionId?: string;

  @ApiPropertyOptional({ description: 'Fishing trip ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  fishingTripId?: string;

  @ApiPropertyOptional({ description: 'Vessel ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  vesselId?: string;
}

export class QueryFormSubmissionDto {
  @ApiPropertyOptional({
    description: 'Filter by form definition ID',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  formDefinitionId?: string;

  @ApiPropertyOptional({ description: 'Filter by vessel ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  vesselId?: string;

  @ApiPropertyOptional({
    description: 'Filter by fishing trip ID',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  fishingTripId?: string;

  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

// ─── Form Submission Data ──────────────────────────────────────────────────

export class CreateFormSubmissionDataDto {
  @ApiProperty({ description: 'Form submission ID', format: 'uuid' })
  @IsUUID()
  formSubmissionId!: string;

  @ApiProperty({ description: 'Form data (JSON object)' })
  @IsObject()
  data!: Record<string, unknown>;
}

export class UpdateFormSubmissionDataDto {
  @ApiPropertyOptional({ description: 'Form data (JSON object)' })
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}

// ─── Form Submission Version ──────────────────────────────────────────────

export class CreateFormSubmissionVersionDto {
  @ApiProperty({ description: 'Form submission ID', format: 'uuid' })
  @IsUUID()
  formSubmissionId!: string;

  @ApiProperty({ description: 'Form data (JSON object)' })
  @IsObject()
  data!: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Change reason', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  changeReason?: string;
}

export class UpdateFormSubmissionVersionDto {
  @ApiPropertyOptional({ description: 'Form data (JSON object)' })
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Change reason', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  changeReason?: string;
}

// ─── Form Definition ───────────────────────────────────────────────────────

export class CreateFormDefinitionDto {
  @ApiProperty({ description: 'Form code', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  formCode!: string;

  @ApiProperty({ description: 'Form name', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ description: 'Description (text)' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Version', maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  version?: string;

  @ApiPropertyOptional({ description: 'Form type', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  formType?: string;

  @ApiPropertyOptional({ description: 'Effective from' })
  @IsOptional()
  @IsString()
  effectiveFrom?: string;

  @ApiPropertyOptional({ description: 'Effective to' })
  @IsOptional()
  @IsString()
  effectiveTo?: string;
}

export class UpdateFormDefinitionDto {
  @ApiPropertyOptional({ description: 'Form code', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  formCode?: string;

  @ApiPropertyOptional({ description: 'Form name', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Description (text)' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Version', maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  version?: string;

  @ApiPropertyOptional({ description: 'Form type', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  formType?: string;

  @ApiPropertyOptional({ description: 'Effective from' })
  @IsOptional()
  @IsString()
  effectiveFrom?: string;

  @ApiPropertyOptional({ description: 'Effective to' })
  @IsOptional()
  @IsString()
  effectiveTo?: string;
}

export class QueryFormDefinitionDto {
  @ApiPropertyOptional({
    description:
      'Filter by exact form code (e.g. M01, M02, M03). Case-insensitive on the backend.',
    example: 'M03',
  })
  @IsOptional()
  @IsString()
  formCode?: string;

  @ApiPropertyOptional({
    description: 'Filter by active flag (true / false)',
    example: true,
  })
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Search by name or code' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by form type' })
  @IsOptional()
  @IsString()
  formType?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

// ─── Fishing Trip ──────────────────────────────────────────────────────────

export class CreateFishingTripDto {
  @ApiProperty({ description: 'Vessel ID', format: 'uuid' })
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
  @IsString()
  departureAt?: string;

  @ApiPropertyOptional({ description: 'Arrival time' })
  @IsOptional()
  @IsString()
  arrivalAt?: string;
}

export class UpdateFishingTripDto {
  @ApiPropertyOptional({ description: 'Vessel ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  vesselId?: string;

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
  @IsString()
  departureAt?: string;

  @ApiPropertyOptional({ description: 'Arrival time' })
  @IsOptional()
  @IsString()
  arrivalAt?: string;
}

export class QueryFishingTripDto {
  @ApiPropertyOptional({ description: 'Filter by vessel ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  vesselId?: string;

  @ApiPropertyOptional({
    description: 'Filter by creator user ID',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  createdBy?: string;

  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by submission status' })
  @IsOptional()
  @IsString()
  submissionStatus?: string;

  @ApiPropertyOptional({ description: 'Filter by trip number' })
  @IsOptional()
  @IsString()
  tripNumber?: string;

  @ApiPropertyOptional({ description: 'Departure from date (ISO string)' })
  @IsOptional()
  @IsString()
  departureFrom?: string;

  @ApiPropertyOptional({ description: 'Departure to date (ISO string)' })
  @IsOptional()
  @IsString()
  departureTo?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

// ─── Fishing Trip Gear ─────────────────────────────────────────────────────

export class CreateFishingTripGearDto {
  @ApiProperty({ description: 'Fishing trip ID', format: 'uuid' })
  @IsUUID()
  fishingTripId!: string;

  @ApiPropertyOptional({ description: 'Fishing gear ID', format: 'uuid' })
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

export class UpdateFishingTripGearDto extends PartialType(
  CreateFishingTripGearDto,
) {}

export class QueryFishingTripGearDto {
  @ApiPropertyOptional({
    description: 'Filter by fishing trip ID',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  fishingTripId?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

// ─── Fishing Trip Crew ─────────────────────────────────────────────────────

export class CreateFishingTripCrewDto {
  @ApiProperty({ description: 'Fishing trip ID', format: 'uuid' })
  @IsUUID()
  fishingTripId!: string;

  @ApiPropertyOptional({
    description: 'User ID (direct reference to logboook-identity-api)',
    format: 'uuid',
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
  @IsString()
  joinedAt?: string;

  @ApiPropertyOptional({ description: 'Left at' })
  @IsOptional()
  @IsString()
  leftAt?: string;
}

export class UpdateFishingTripCrewDto {
  @ApiPropertyOptional({ description: 'Fishing trip ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  fishingTripId?: string;

  @ApiPropertyOptional({ description: 'User ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Crew role', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  crewRole?: string;

  @ApiPropertyOptional({ description: 'Joined at' })
  @IsOptional()
  @IsString()
  joinedAt?: string;

  @ApiPropertyOptional({ description: 'Left at' })
  @IsOptional()
  @IsString()
  leftAt?: string;
}

export class QueryFishingTripCrewDto {
  @ApiPropertyOptional({
    description: 'Filter by fishing trip ID',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  fishingTripId?: string;

  @ApiPropertyOptional({ description: 'Filter by user ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

// ─── Fishing Gear ──────────────────────────────────────────────────────────

export class CreateFishingGearDto {
  @ApiPropertyOptional({ description: 'Vessel ID', format: 'uuid' })
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

export class UpdateFishingGearDto {
  @ApiPropertyOptional({ description: 'Vessel ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  vesselId?: string;

  @ApiPropertyOptional({ description: 'Gear name', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

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

export class QueryFishingGearDto {
  @ApiPropertyOptional({ description: 'Filter by vessel ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  vesselId?: string;

  @ApiPropertyOptional({ description: 'Search by name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

// ─── Client Device ─────────────────────────────────────────────────────────

export class CreateClientDeviceDto {
  @ApiProperty({ description: 'Device ID (unique)', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  deviceId!: string;

  @ApiPropertyOptional({
    description: 'Platform (ios/android/web)',
    maxLength: 30,
  })
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

export class UpdateClientDeviceDto {
  @ApiPropertyOptional({ description: 'Device ID', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  deviceId?: string;

  @ApiPropertyOptional({
    description: 'Platform (ios/android/web)',
    maxLength: 30,
  })
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

export class QueryClientDeviceDto {
  @ApiPropertyOptional({ description: 'Filter by platform' })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

// ─── Catch Record ──────────────────────────────────────────────────────────

export class CreateCatchRecordDto {
  @ApiProperty({ description: 'Fishing operation ID', format: 'uuid' })
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

export class UpdateCatchRecordDto extends PartialType(CreateCatchRecordDto) {}

export class QueryCatchRecordDto {
  @ApiPropertyOptional({
    description: 'Filter by fishing operation ID',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  fishingOperationId?: string;

  @ApiPropertyOptional({ description: 'Search by species name or code' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

// ─── Attachment ────────────────────────────────────────────────────────────

export class CreateAttachmentDto {
  @ApiPropertyOptional({ description: 'Owner user ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  ownerUserId?: string;

  @ApiPropertyOptional({ description: 'Vessel ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  vesselId?: string;

  @ApiPropertyOptional({ description: 'Fishing trip ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  fishingTripId?: string;

  @ApiPropertyOptional({ description: 'Form submission ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  formSubmissionId?: string;

  @ApiPropertyOptional({ description: 'Incident ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  incidentId?: string;

  @ApiPropertyOptional({ description: 'File name', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  @ApiPropertyOptional({ description: 'File type', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fileType?: string;

  @ApiPropertyOptional({ description: 'MIME type', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  mimeType?: string;
}

export class UpdateAttachmentDto {
  @ApiPropertyOptional({ description: 'Owner user ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  ownerUserId?: string;

  @ApiPropertyOptional({ description: 'Vessel ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  vesselId?: string;

  @ApiPropertyOptional({ description: 'Fishing trip ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  fishingTripId?: string;

  @ApiPropertyOptional({ description: 'Form submission ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  formSubmissionId?: string;

  @ApiPropertyOptional({ description: 'Incident ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  incidentId?: string;

  @ApiPropertyOptional({ description: 'File name', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  @ApiPropertyOptional({ description: 'File type', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fileType?: string;

  @ApiPropertyOptional({ description: 'MIME type', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  mimeType?: string;
}

export class QueryAttachmentDto {
  @ApiPropertyOptional({ description: 'Filter by vessel ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  vesselId?: string;

  @ApiPropertyOptional({
    description: 'Filter by fishing trip ID',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  fishingTripId?: string;

  @ApiPropertyOptional({
    description: 'Filter by form submission ID',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  formSubmissionId?: string;

  @ApiPropertyOptional({ description: 'Filter by incident ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  incidentId?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

// ─── Form Submission Confirmation ───────────────────────────────────────────

export class ConfirmFormSubmissionDto {
  @ApiPropertyOptional({ description: 'Issuance date' })
  @IsOptional()
  @IsString()
  issuanceDate?: string;

  @ApiProperty({
    description: 'Confirmed quantity in kg (decimal)',
    example: 150.5,
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  confirmedQuantity!: number;

  @ApiPropertyOptional({ description: 'Buyer name', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  buyerName?: string;

  @ApiPropertyOptional({ description: 'Buyer organization', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  buyerOrganization?: string;

  @ApiPropertyOptional({ description: 'Buyer address', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  buyerAddress?: string;

  @ApiPropertyOptional({ description: 'Notes (text)' })
  @IsOptional()
  @IsString()
  notes?: string;
}

// ─── Fishing Operation ─────────────────────────────────────────────────────

export class CreateFishingOperationDto {
  @ApiProperty({ description: 'Fishing trip ID', format: 'uuid' })
  @IsUUID()
  fishingTripId!: string;

  @ApiPropertyOptional({
    description: 'Latitude (decimal, precision 7)',
    example: 9.5234567,
    type: Number,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 7 })
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude (decimal, precision 7)',
    example: 104.1234567,
    type: Number,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 7 })
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  longitude?: number;

  @ApiPropertyOptional({ description: 'Operation start time' })
  @IsOptional()
  @IsString()
  operationStartedAt?: string;

  @ApiPropertyOptional({ description: 'Operation end time' })
  @IsOptional()
  @IsString()
  operationEndedAt?: string;

  @ApiPropertyOptional({ description: 'Operation type', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  operationType?: string;

  @ApiPropertyOptional({ description: 'Fishing gear type', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fishingGearType?: string;

  @ApiPropertyOptional({ description: 'Fishing ground', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fishingGround?: string;

  @ApiPropertyOptional({
    description: 'Depth in meters (decimal)',
    example: 45.0,
    type: Number,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  depth?: number;

  @ApiPropertyOptional({ description: 'Notes (text)' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateFishingOperationDto extends PartialType(
  CreateFishingOperationDto,
) {}

export class QueryFishingOperationDto {
  @ApiPropertyOptional({
    description: 'Filter by fishing trip ID',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  fishingTripId?: string;

  @ApiPropertyOptional({ description: 'Filter by operation type' })
  @IsOptional()
  @IsString()
  operationType?: string;

  @ApiPropertyOptional({ description: 'From date (ISO string)' })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ description: 'To date (ISO string)' })
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

// ─── Regulatory Forms (M01 / M02 / M03) ────────────────────────────────────

export class CreateM01Dto {
  @ApiProperty({ description: 'Vessel ID', format: 'uuid' })
  @IsUUID()
  vesselId!: string;

  @ApiPropertyOptional({ description: 'Fishing trip ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  fishingTripId?: string;

  @ApiPropertyOptional({ description: 'Issuance date' })
  @IsOptional()
  @IsString()
  issuanceDate?: string;

  @ApiPropertyOptional({ description: 'Captain name', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  captainName?: string;

  @ApiPropertyOptional({ description: 'Captain ID number', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  captainIdNumber?: string;

  @ApiPropertyOptional({
    description: 'Fishing license number',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fishingLicenseNumber?: string;

  @ApiPropertyOptional({ description: 'Fishing license expiry' })
  @IsOptional()
  @IsString()
  fishingLicenseExpiry?: string;

  @ApiPropertyOptional({
    description: 'Length category override',
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  lengthCategoryOverride?: string;

  @ApiPropertyOptional({ description: 'Species list' })
  @IsOptional()
  @IsArray()
  speciesList?: Array<{
    speciesCode?: string;
    speciesName?: string;
    harvestedQuantity?: string;
    purchasedQuantity?: string;
    unit?: string;
    buyerName?: string;
    buyerOrganization?: string;
    buyerAddress?: string;
  }>;

  @ApiPropertyOptional({ description: 'Notes (text)' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateM02Dto {
  @ApiProperty({ description: 'Vessel ID', format: 'uuid' })
  @IsUUID()
  vesselId!: string;

  @ApiPropertyOptional({ description: 'Fishing trip ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  fishingTripId?: string;

  @ApiPropertyOptional({ description: 'Inspection date' })
  @IsOptional()
  @IsString()
  inspectionDate?: string;

  @ApiPropertyOptional({ description: 'Inspection unit', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  inspectionUnit?: string;

  @ApiPropertyOptional({ description: 'Inspectors' })
  @IsOptional()
  @IsArray()
  inspectors?: string[];

  @ApiPropertyOptional({ description: 'Document checks' })
  @IsOptional()
  @IsObject()
  documentChecks?: {
    fishingReport?: boolean;
    fishingLogbook?: boolean;
  };

  @ApiPropertyOptional({ description: 'Reported catch quantity (decimal)' })
  @IsOptional()
  @IsString()
  reportedCatchQuantity?: string;

  @ApiPropertyOptional({ description: 'Actual catch quantity (decimal)' })
  @IsOptional()
  @IsString()
  actualCatchQuantity?: string;

  @ApiPropertyOptional({ description: 'Conclusion', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  conclusion?: string;

  @ApiPropertyOptional({ description: 'Notes (text)' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateM03Dto {
  @ApiProperty({ description: 'Vessel ID', format: 'uuid' })
  @IsUUID()
  vesselId!: string;

  @ApiPropertyOptional({ description: 'Fishing trip ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  fishingTripId?: string;

  @ApiPropertyOptional({ description: 'Inspection date' })
  @IsOptional()
  @IsString()
  inspectionDate?: string;

  @ApiPropertyOptional({ description: 'Inspection unit', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  inspectionUnit?: string;

  @ApiPropertyOptional({ description: 'Inspectors' })
  @IsOptional()
  @IsArray()
  inspectors?: string[];

  @ApiPropertyOptional({ description: 'Document checklist' })
  @IsOptional()
  @IsObject()
  documents?: {
    vesselRegistration?: boolean;
    crewList?: boolean;
    technicalSafetyCertificate?: boolean;
    captainQualification?: boolean;
    fishingLicense?: boolean;
    chiefEngineerQualification?: boolean;
    fishingLogbookOrPurchase?: boolean;
    foodSafetyCertificate?: boolean;
  };

  @ApiPropertyOptional({ description: 'Equipment checks' })
  @IsOptional()
  @IsObject()
  equipment?: {
    navigationEquipment?: 'D' | 'T';
    lifesavingFirefighting?: 'D' | 'T';
    communicationSignaling?: 'D' | 'T';
    vesselMonitoring?: 'D' | 'T';
  };

  @ApiPropertyOptional({ description: 'Fishing occupations' })
  @IsOptional()
  @IsArray()
  fishingOccupations?: Array<
    | 'TRAWL'
    | 'PURSE_SEINE'
    | 'SURROUNDING_NET'
    | 'HOOK_LINE'
    | 'GILLNET'
    | 'TRAPS_CAGES'
    | 'OTHER'
    | 'VESSEL_MARKING'
  >;

  @ApiPropertyOptional({ description: 'Crew count' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  crewCount?: number;

  @ApiPropertyOptional({ description: 'Previous trip submission' })
  @IsOptional()
  @IsObject()
  previousTripSubmission?: {
    fishingReportSubmitted?: boolean;
    fishingLogbookSubmitted?: boolean;
  };

  @ApiPropertyOptional({ description: 'Conclusion', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  conclusion?: string;

  @ApiPropertyOptional({ description: 'Notes (text)' })
  @IsOptional()
  @IsString()
  notes?: string;
}

// ─── Fishing Operation Profile (PHASE 8) ──────────────────────────────────

export class CreateFishingOperationProfileDto {
  @ApiProperty({
    description: 'User ID (logical reference to logboook-identity-api)',
    format: 'uuid',
  })
  @IsUUID()
  userId!: string;

  @ApiPropertyOptional({
    description: 'Status (default: ACTIVE)',
    enum: ['ACTIVE', 'INACTIVE'],
  })
  @IsOptional()
  @IsString()
  @IsEnum(['ACTIVE', 'INACTIVE'])
  status?: 'ACTIVE' | 'INACTIVE';
}

export class SearchFishingOperationProfileDto {
  @ApiPropertyOptional({
    description: 'Search by fisherman code (exact match)',
    example: 'FSH-000123',
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  fishermanCode?: string;

  @ApiPropertyOptional({
    description: 'Search by user ID (exact match)',
    format: 'uuid',
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
  @IsEnum(['ACTIVE', 'INACTIVE'])
  status?: 'ACTIVE' | 'INACTIVE';
}

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
