/**
 * PHASE 8 — Logbook Identity DTOs for Gateway Swagger.
 * Copied verbatim from downstream logboook-identity-api.
 */

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsEmail,
  IsDateString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── Enums ────────────────────────────────────────────────────────────────

export enum IdentifierType {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
}

export enum AccountType {
  FISHERMAN = 'FISHERMAN',
  CAPTAIN = 'CAPTAIN',
  OWNER = 'OWNER',
}

export enum AccountStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  LOCKED = 'LOCKED',
  SUSPENDED = 'SUSPENDED',
  DISABLED = 'DISABLED',
}

export enum IdentityDocumentType {
  CCCD = 'CCCD',
  CMND = 'CMND',
  PASSPORT = 'PASSPORT',
  OTHER = 'OTHER',
}

// ─── Auth DTOs ────────────────────────────────────────────────────────────

export class RegisterDto {
  @ApiProperty({
    description: 'Full name of the fisherman',
    example: 'Nguyễn Văn A',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullName!: string;

  @ApiProperty({
    enum: IdentifierType,
    description: 'Type of identifier to register with',
    example: IdentifierType.EMAIL,
  })
  @IsEnum(IdentifierType)
  identifierType!: IdentifierType;

  @ApiProperty({
    description: 'Identifier value (email or phone number)',
    example: 'user@example.com',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  identifier!: string;

  @ApiPropertyOptional({
    description: 'Date of birth (YYYY-MM-DD)',
    example: '1990-01-15',
  })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    description: 'Gender',
    example: 'Male',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  gender?: string;

  @ApiPropertyOptional({
    description: 'Nationality',
    example: 'Vietnamese',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nationality?: string;

  @ApiPropertyOptional({
    description: 'Place of birth',
    example: 'Hanoi, Vietnam',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  placeOfBirth?: string;

  @ApiPropertyOptional({
    description: 'Identity document number',
    example: '012345678901',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  identityDocumentNumber?: string;

  @ApiPropertyOptional({
    description: 'Province/State code',
    example: '92',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  provinceCode?: string;

  @ApiPropertyOptional({
    description: 'District code',
    example: '921',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  districtCode?: string;

  @ApiPropertyOptional({
    description: 'Ward code',
    example: '92101',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  wardCode?: string;
}

export class LoginDto {
  @ApiProperty({
    enum: IdentifierType,
    description: 'Type of identifier to login with',
    example: IdentifierType.EMAIL,
  })
  @IsEnum(IdentifierType)
  identifierType!: IdentifierType;

  @ApiProperty({
    description: 'Identifier value (email or phone number)',
    example: 'user@example.com',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  identifier!: string;

  @ApiProperty({
    description: 'Password',
    example: 'Password123!',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiPropertyOptional({ description: 'Client IP address' })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'User agent' })
  @IsOptional()
  @IsString()
  userAgent?: string;
}

export class ForgotPasswordDto {
  @ApiProperty({
    enum: IdentifierType,
    description: 'Type of identifier',
    example: IdentifierType.EMAIL,
  })
  @IsEnum(IdentifierType)
  identifierType!: IdentifierType;

  @ApiProperty({
    description: 'Identifier value (email or phone)',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  identifier!: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    enum: IdentifierType,
    description: 'Type of identifier',
    example: IdentifierType.EMAIL,
  })
  @IsEnum(IdentifierType)
  identifierType!: IdentifierType;

  @ApiProperty({
    description: 'Identifier value',
    example: 'user@example.com',
  })
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @ApiProperty({
    description: 'One-time password from email/SMS',
    example: '123456',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  otp!: string;

  @ApiProperty({
    description: 'New password (min 8 characters)',
    example: 'Matkhau@123',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword!: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

// ─── Account DTOs ─────────────────────────────────────────────────────────

export class CreateAccountDto {
  @ApiPropertyOptional({
    enum: AccountType,
    default: AccountType.FISHERMAN,
    description: 'Type of account',
    example: AccountType.FISHERMAN,
  })
  @IsOptional()
  @IsEnum(AccountType)
  accountType?: AccountType;
}

export class UpdateAccountDto {
  @ApiPropertyOptional({
    enum: AccountType,
    description: 'Type of account',
    example: AccountType.FISHERMAN,
  })
  @IsOptional()
  @IsEnum(AccountType)
  accountType?: AccountType;

  @ApiPropertyOptional({
    enum: AccountStatus,
    description: 'Status of account',
    example: AccountStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;
}

// ─── Fisherman Profile DTOs ───────────────────────────────────────────────

export class CreateFishermanProfileDto {
  @ApiProperty({
    description: 'Full name of the fisherman',
    example: 'Nguyễn Văn A',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullName!: string;

  @ApiPropertyOptional({
    description: 'Date of birth (YYYY-MM-DD)',
    example: '1990-01-15',
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    description: 'Gender',
    example: 'Male',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  gender?: string;

  @ApiPropertyOptional({
    description: 'Nationality',
    example: 'Vietnamese',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nationality?: string;

  @ApiPropertyOptional({
    description: 'Place of birth',
    example: 'Hanoi, Vietnam',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  placeOfBirth?: string;

  @ApiPropertyOptional({
    enum: IdentityDocumentType,
    description: 'Type of identity document',
    example: IdentityDocumentType.CCCD,
  })
  @IsOptional()
  @IsEnum(IdentityDocumentType)
  identityDocumentType?: IdentityDocumentType;

  @ApiPropertyOptional({
    description: 'Identity document number',
    example: '012345678901',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  identityDocumentNumber?: string;

  @ApiPropertyOptional({
    description: 'Identity document issued date (YYYY-MM-DD)',
    example: '2020-01-01',
  })
  @IsOptional()
  @IsDateString()
  identityDocumentIssuedDate?: string;

  @ApiPropertyOptional({
    description: 'Identity document issued place',
    example: 'Công an tỉnh Cần Thơ',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  identityDocumentIssuedPlace?: string;

  @ApiPropertyOptional({
    description: 'Identity document expiry date (YYYY-MM-DD)',
    example: '2030-01-01',
  })
  @IsOptional()
  @IsDateString()
  identityDocumentExpiryDate?: string;

  @ApiPropertyOptional({
    description: 'Full address line',
    example: '123 Đường 3/2, Phường Xuân Khánh, Quận Ninh Kiều',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  addressLine?: string;

  @ApiPropertyOptional({
    description: 'Province/State code',
    example: '92',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  provinceCode?: string;

  @ApiPropertyOptional({
    description: 'District code',
    example: '921',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  districtCode?: string;

  @ApiPropertyOptional({
    description: 'Ward code',
    example: '92101',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  wardCode?: string;

  @ApiPropertyOptional({
    description: 'Emergency contact name',
    example: 'Trần Thị B',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  emergencyContactName?: string;

  @ApiPropertyOptional({
    description: 'Emergency contact phone',
    example: '0909123456',
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  emergencyContactPhone?: string;
}

export class UpdateFishermanProfileDto {
  @ApiPropertyOptional({
    description: 'Full name of the fisherman',
    maxLength: 255,
    example: 'Nguyễn Văn A Updated',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Date of birth (YYYY-MM-DD)',
    example: '1990-01-15',
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    description: 'Gender',
    example: 'Male',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  gender?: string;

  @ApiPropertyOptional({
    description: 'Nationality',
    example: 'Vietnamese',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nationality?: string;

  @ApiPropertyOptional({
    description: 'Place of birth',
    example: 'Hà Nội',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  placeOfBirth?: string;

  @ApiPropertyOptional({
    enum: IdentityDocumentType,
    description: 'Type of identity document',
    example: IdentityDocumentType.CCCD,
  })
  @IsOptional()
  @IsEnum(IdentityDocumentType)
  identityDocumentType?: IdentityDocumentType;

  @ApiPropertyOptional({
    description: 'Identity document number',
    example: '012345678901',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  identityDocumentNumber?: string;

  @ApiPropertyOptional({
    description: 'Identity document issued date (YYYY-MM-DD)',
    example: '2020-01-01',
  })
  @IsOptional()
  @IsDateString()
  identityDocumentIssuedDate?: string;

  @ApiPropertyOptional({
    description: 'Identity document issued place',
    example: 'Công an tỉnh Cần Thơ',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  identityDocumentIssuedPlace?: string;

  @ApiPropertyOptional({
    description: 'Identity document expiry date (YYYY-MM-DD)',
    example: '2030-01-01',
  })
  @IsOptional()
  @IsDateString()
  identityDocumentExpiryDate?: string;

  @ApiPropertyOptional({
    description: 'Full address line',
    example: '123 Đường 3/2, Phường Xuân Khánh',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  addressLine?: string;

  @ApiPropertyOptional({
    description: 'Province/State code',
    example: '92',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  provinceCode?: string;

  @ApiPropertyOptional({
    description: 'District code',
    example: '921',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  districtCode?: string;

  @ApiPropertyOptional({
    description: 'Ward code',
    example: '92101',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  wardCode?: string;

  @ApiPropertyOptional({
    description: 'Emergency contact name',
    example: 'Trần Thị B',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  emergencyContactName?: string;

  @ApiPropertyOptional({
    description: 'Emergency contact phone',
    example: '0909123456',
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  emergencyContactPhone?: string;
}

// ─── Account Identifier DTOs ───────────────────────────────────────────────

export class AddAccountIdentifierDto {
  @ApiProperty({
    enum: IdentifierType,
    description: 'Type of identifier (EMAIL or PHONE)',
    example: IdentifierType.PHONE,
  })
  @IsEnum(IdentifierType, { message: 'type must be EMAIL or PHONE' })
  type!: IdentifierType;

  @ApiProperty({
    description: 'Identifier value (email or phone number)',
    example: '0909123456',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  value!: string;

  @ApiPropertyOptional({
    description: 'Whether this is the primary identifier',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class UpdateAccountIdentifierDto {
  @ApiPropertyOptional({
    description: 'Whether this is the primary identifier',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
