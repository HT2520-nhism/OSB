import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { IdentityDocumentType } from '../../constants/enums/identity-document-type.enum';

export class UpdateFishermanProfileDto {
  @ApiPropertyOptional({
    description: 'Full name of the fisherman',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Date of birth (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    description: 'Gender',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  gender?: string;

  @ApiPropertyOptional({
    description: 'Nationality',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nationality?: string;

  @ApiPropertyOptional({
    description: 'Place of birth',
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
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  identityDocumentNumber?: string;

  @ApiPropertyOptional({
    description: 'Identity document issued date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  identityDocumentIssuedDate?: string;

  @ApiPropertyOptional({
    description: 'Identity document issued place',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  identityDocumentIssuedPlace?: string;

  @ApiPropertyOptional({
    description: 'Identity document expiry date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  identityDocumentExpiryDate?: string;

  @ApiPropertyOptional({
    description: 'Full address line',
  })
  @IsOptional()
  @IsString()
  addressLine?: string;

  @ApiPropertyOptional({
    description: 'Province/State code',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  provinceCode?: string;

  @ApiPropertyOptional({
    description: 'District code',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  districtCode?: string;

  @ApiPropertyOptional({
    description: 'Ward code',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  wardCode?: string;

  @ApiPropertyOptional({
    description: 'Emergency contact name',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  emergencyContactName?: string;

  @ApiPropertyOptional({
    description: 'Emergency contact phone',
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  emergencyContactPhone?: string;
}
