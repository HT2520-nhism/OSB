import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';

import { IdentifierType } from '../../../constants/enums/identifier-type.enum';

export class ForgotPasswordDto {
  @IsEnum(IdentifierType)
  @IsNotEmpty()
  identifierType!: IdentifierType;

  @IsEmail()
  @IsNotEmpty()
  identifier!: string;
}
