import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { AccountType } from '../../constants/enums/account-type.enum';

export class CreateAccountDto {
  @ApiPropertyOptional({
    enum: AccountType,
    default: AccountType.FISHERMAN,
    description: 'Type of account',
  })
  @IsOptional()
  @IsEnum(AccountType)
  accountType?: AccountType;
}
