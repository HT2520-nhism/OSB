import { Exclude, Expose, plainToInstance } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

import { AccountStatus } from '../../constants/enums/account-status.enum';
import { AccountType } from '../../constants/enums/account-type.enum';
import { SystemRole } from '../../constants/enums/system-role.enum';

@Exclude()
export class AccountResponseDto {
  @ApiProperty({ description: 'Account UUID' })
  @Expose()
  id!: string;

  @ApiProperty({ enum: AccountStatus, description: 'Account status' })
  @Expose()
  status!: AccountStatus;

  @ApiProperty({ enum: AccountType, description: 'Account type' })
  @Expose()
  accountType!: AccountType;

  @ApiProperty({
    enum: SystemRole,
    description: 'System role for Electronic Logbook authorization',
  })
  @Expose()
  systemRole!: SystemRole;

  @ApiProperty({ description: 'Last password change timestamp' })
  @Expose()
  passwordChangedAt!: Date | null;

  @ApiProperty({ description: 'Last login timestamp' })
  @Expose()
  lastLoginAt!: Date | null;

  @ApiProperty({ description: 'Account creation timestamp' })
  @Expose()
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  updatedAt!: Date;

  static fromEntity(entity: any): AccountResponseDto {
    return plainToInstance(AccountResponseDto, entity, {
      excludeExtraneousValues: false,
    });
  }
}
