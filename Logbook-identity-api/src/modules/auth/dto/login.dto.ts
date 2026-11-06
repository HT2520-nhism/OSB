import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { IdentifierType } from '../../../constants/enums/identifier-type.enum';

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
  @MaxLength(255)
  identifier!: string;

  @ApiProperty({
    description: 'Password',
    example: 'Password123!',
  })
  @IsString()
  password!: string;

  @ApiProperty({ description: 'Client IP address', required: false })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiProperty({ description: 'User agent', required: false })
  @IsOptional()
  @IsString()
  userAgent?: string;
}
