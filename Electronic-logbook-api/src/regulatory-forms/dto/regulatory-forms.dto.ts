import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── M01 — Receipt of catch products (unloading) ──────────────────────────

export class M01SpeciesDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  speciesCode?: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  speciesName?: string;

  @ApiPropertyOptional({ description: 'Harvested quantity (decimal string)' })
  @IsOptional()
  @IsString()
  harvestedQuantity?: string;

  @ApiPropertyOptional({ description: 'Purchased quantity (decimal string)' })
  @IsOptional()
  @IsString()
  purchasedQuantity?: string;

  @ApiPropertyOptional({ maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  unit?: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  buyerName?: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  buyerOrganization?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  buyerAddress?: string;
}


export class M01RemainingBalanceItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  speciesName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purchasedQuantity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  confirmedQuantity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remainingQuantity?: string;
}

export class M01SectionBDto {
  @ApiPropertyOptional({ description: 'Tên tổ chức quản lý cảng cá' })
  @IsOptional()
  @IsString()
  portAuthorityName?: string;

  @ApiPropertyOptional({ description: 'Giấy xác nhận nguyên liệu thủy sản khai thác số' })
  @IsOptional()
  @IsString()
  confirmationNumber?: string;

  @ApiPropertyOptional({ description: 'Ngày xác nhận' })
  @IsOptional()
  @IsString()
  confirmationDate?: string;

  @ApiPropertyOptional({ type: [M01RemainingBalanceItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => M01RemainingBalanceItemDto)
  remainingBalanceList?: M01RemainingBalanceItemDto[];
}

export class M01CoaRemainingItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  speciesName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  previousRemainingQuantity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  certifiedQuantity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remainingAfterCertification?: string;
}

export class M01SectionCDto {
  @ApiPropertyOptional({ description: 'Tên cơ quan có thẩm quyền' })
  @IsOptional()
  @IsString()
  authorityName?: string;

  @ApiPropertyOptional({ description: 'Giấy chứng nhận COA số' })
  @IsOptional()
  @IsString()
  coaNumber?: string;

  @ApiPropertyOptional({ description: 'Ngày chứng nhận COA' })
  @IsOptional()
  @IsString()
  coaDate?: string;

  @ApiPropertyOptional({ type: [M01CoaRemainingItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => M01CoaRemainingItemDto)
  coaRemainingList?: M01CoaRemainingItemDto[];
}

export class CreateM01Dto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  vesselId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  fishingTripId?: string;

  @ApiProperty({ description: 'Issuance date (ISO)' })
  @IsString()
  issuanceDate!: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  captainName?: string;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  captainIdNumber?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fishingLicenseNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fishingLicenseExpiry?: string;

  @ApiPropertyOptional({ maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  lengthCategoryOverride?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  buyerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  buyerAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  sectionB?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  sectionC?: Record<string, unknown>;

  @ApiPropertyOptional({ type: [M01SpeciesDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => M01SpeciesDto)
  speciesList?: M01SpeciesDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

// ─── M02 — Inspection on arrival ──────────────────────────────────────────


export class M02SpeciesCheckDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  speciesName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reportedQuantity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actualQuantity?: string;
}

export class CreateM02Dto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  vesselId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  fishingTripId?: string;

  @ApiProperty()
  @IsString()
  inspectionDate!: string;

  @ApiProperty({ maxLength: 255 })
  @IsString()
  @MaxLength(255)
  inspectionUnit!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  inspectors!: string[];

  @ApiProperty({ type: 'object', additionalProperties: true })
  @IsObject()
  documentChecks!: {
    fishingReport?: boolean;
    fishingLogbook?: boolean;
  };

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reportedCatchQuantity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actualCatchQuantity?: string;

  @ApiPropertyOptional({ type: [M02SpeciesCheckDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => M02SpeciesCheckDto)
  speciesChecks?: M02SpeciesCheckDto[];

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  conclusion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

// ─── M03 — Inspection before departure ────────────────────────────────────

const EQUIPMENT_VALUES = ['D', 'T'] as const;
const FISHING_OCCUPATIONS = [
  'TRAWL',
  'PURSE_SEINE',
  'SURROUNDING_NET',
  'HOOK_LINE',
  'GILLNET',
  'TRAPS_CAGES',
  'OTHER',
  'VESSEL_MARKING',
] as const;

export class CreateM03Dto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  vesselId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  fishingTripId?: string;

  @ApiProperty()
  @IsString()
  inspectionDate!: string;

  @ApiProperty({ maxLength: 255 })
  @IsString()
  @MaxLength(255)
  inspectionUnit!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  inspectors!: string[];

  @ApiProperty({ type: 'object', additionalProperties: true })
  @IsObject()
  documents!: {
    vesselRegistration?: boolean;
    crewList?: boolean;
    technicalSafetyCertificate?: boolean;
    captainQualification?: boolean;
    fishingLicense?: boolean;
    chiefEngineerQualification?: boolean;
    fishingLogbookOrPurchase?: boolean;
    foodSafetyCertificate?: boolean;
  };

  @ApiProperty({ type: 'object', additionalProperties: true })
  @IsObject()
  equipment!: {
    navigationEquipment?: 'D' | 'T';
    lifesavingFirefighting?: 'D' | 'T';
    communicationSignaling?: 'D' | 'T';
    vesselMonitoring?: 'D' | 'T';
  };

  @ApiProperty({ type: [String], enum: FISHING_OCCUPATIONS })
  @IsArray()
  @IsIn(FISHING_OCCUPATIONS, { each: true })
  fishingOccupations!: Array<(typeof FISHING_OCCUPATIONS)[number]>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  otherOccupation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  crewCount?: number;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  previousTripSubmission?: {
    fishingReportSubmitted?: boolean;
    fishingLogbookSubmitted?: boolean;
  };

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  conclusion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}


// ─── NKKT — Fishing Logbook (Circular 01/2022/TT-BNNPTNT) ──────────────────

export class EndangeredSpeciesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  operationNumber?: number;

  @ApiProperty()
  @IsString()
  speciesName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  spottedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  estimatedWeightKg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  estimatedCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  estimatedSizeCm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  condition?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  extraNotes?: string;
}

export class TransshipmentCatchDto {
  @ApiProperty()
  @IsString()
  speciesName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  quantityKg?: number;
}

export class TransshipmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  carrierVesselRegNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  carrierLicenseNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  carrierCaptainName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ type: [TransshipmentCatchDto] })
  @IsOptional()
  @IsArray()
  catches?: TransshipmentCatchDto[];
}

export class CreateNKKTDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  vesselId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  fishingTripId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tripIdentifier?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mainOccupation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subOccupation1?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subOccupation2?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  gearSpecifications?: Record<string, unknown>;

  @ApiPropertyOptional({ type: [EndangeredSpeciesDto] })
  @IsOptional()
  @IsArray()
  endangeredSpecies?: EndangeredSpeciesDto[];

  @ApiPropertyOptional({ type: [TransshipmentDto] })
  @IsOptional()
  @IsArray()
  transshipments?: TransshipmentDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logbookNumber?: string;

  @ApiPropertyOptional({ description: 'Mục 9: Tên tổ chức, cá nhân thu mua' })
  @IsOptional()
  @IsString()
  buyerName?: string;

  @ApiPropertyOptional({ description: 'Mục 9: Địa chỉ đơn vị thu mua' })
  @IsOptional()
  @IsString()
  buyerAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
