import { IsEnum, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { IdentifierType } from '../../../constants/enums/identifier-type.enum';

export class RegisterDto {
  @ApiProperty({
    description: 'Full name of the fisherman',
    example: 'Nguyễn Văn A',
    maxLength: 255,
  })
  @IsString()
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
}
