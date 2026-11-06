import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { IdentityDocumentType } from '../../constants/enums/identity-document-type.enum';

export class CreateFishermanProfileDto {
  @ApiProperty({
    description: 'Full name of the fisherman',
    example: 'Nguyễn Văn A',
    maxLength: 255,
  })
  @IsString()
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
    example: 'Hanoi Police Department',
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
    example: '123 Main Street, Ward 1, District 1',
  })
  @IsOptional()
  @IsString()
  addressLine?: string;

  @ApiPropertyOptional({
    description: 'Province/State code',
    example: 'HN',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  provinceCode?: string;

  @ApiPropertyOptional({
    description: 'District code',
    example: 'D001',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  districtCode?: string;

  @ApiPropertyOptional({
    description: 'Ward code',
    example: 'W001',
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
    example: '+84901234567',
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  emergencyContactPhone?: string;
}
