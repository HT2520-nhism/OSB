import {
  IsEnum,
  IsString,
  IsOptional,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { IdentifierType } from '../../constants/enums/identifier-type.enum';

export class AddAccountIdentifierDto {
  @ApiProperty({
    enum: IdentifierType,
    description: 'Type of identifier (EMAIL or PHONE)',
  })
  @IsEnum(IdentifierType, {
    message: 'type must be EMAIL or PHONE',
  })
  type!: IdentifierType;

  @ApiProperty({
    description: 'Identifier value (email or phone number)',
    example: 'user@example.com',
  })
  @IsString()
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
