import { IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';

import { IdentifierType } from '../../../constants/enums/identifier-type.enum';

export class ResetPasswordDto {
  @IsEnum(IdentifierType)
  @IsNotEmpty()
  identifierType!: IdentifierType;

  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  otp!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword!: string;
}
