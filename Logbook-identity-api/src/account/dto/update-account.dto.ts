import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { AccountType } from '../../constants/enums/account-type.enum';
import { AccountStatus } from '../../constants/enums/account-status.enum';
import { SystemRole } from '../../constants/enums/system-role.enum';

export class UpdateAccountDto {
  @ApiPropertyOptional({
    enum: AccountType,
    description: 'Type of account',
  })
  @IsOptional()
  @IsEnum(AccountType)
  accountType?: AccountType;

  @ApiPropertyOptional({
    enum: AccountStatus,
    description: 'Status of account',
  })
  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;

  @ApiPropertyOptional({
    enum: SystemRole,
    description: 'System role for Electronic Logbook authorization',
  })
  @IsOptional()
  @IsEnum(SystemRole)
  systemRole?: SystemRole;
}
