import { ApiProperty } from '@nestjs/swagger';

import { AccountStatus } from '../../../constants/enums/account-status.enum';
import { AccountType } from '../../../constants/enums/account-type.enum';
import { IdentifierType } from '../../../constants/enums/identifier-type.enum';
import { ProfileStatus } from '../../../constants/enums/profile-status.enum';
import { SystemRole } from '../../../constants/enums/system-role.enum';

export class RegistrationResponseDto {
  @ApiProperty({ description: 'Created account information' })
  account!: {
    id: string;
    status: AccountStatus;
    accountType: AccountType;
  };

  @ApiProperty({ description: 'Created identifier information' })
  identifier!: {
    type: IdentifierType;
    value: string;
    isPrimary: boolean;
    isVerified: boolean;
  };

  @ApiProperty({ description: 'Created profile information' })
  profile!: {
    fullName: string;
    profileStatus: ProfileStatus;
  };
}

export class LoginResponseDto {
  @ApiProperty({ description: 'Access token' })
  accessToken!: string;

  @ApiProperty({ description: 'Refresh token' })
  refreshToken!: string;

  @ApiProperty({ description: 'Token expiration time in seconds' })
  expiresIn!: number;

  @ApiProperty({ description: 'Token type', example: 'Bearer' })
  tokenType!: string;

  @ApiProperty({ description: 'User information' })
  user!: {
    id: string;
    accountType: AccountType;
    systemRole: SystemRole;
  };
}

export class RefreshResponseDto {
  @ApiProperty({ description: 'New access token' })
  accessToken!: string;

  @ApiProperty({ description: 'New refresh token' })
  refreshToken!: string;

  @ApiProperty({ description: 'Token expiration time in seconds' })
  expiresIn!: number;

  @ApiProperty({ description: 'Token type', example: 'Bearer' })
  tokenType!: string;
}
