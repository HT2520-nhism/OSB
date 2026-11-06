import { Exclude, Expose, plainToInstance } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

import { IdentifierType } from '../../constants/enums/identifier-type.enum';

@Exclude()
export class AccountIdentifierResponseDto {
  @ApiProperty({ description: 'Identifier UUID' })
  @Expose()
  id!: string;

  @ApiProperty({ enum: IdentifierType, description: 'Identifier type' })
  @Expose()
  type!: IdentifierType;

  @ApiProperty({ description: 'Identifier value' })
  @Expose()
  value!: string;

  @ApiProperty({ description: 'Whether this is the primary identifier' })
  @Expose()
  isPrimary!: boolean;

  @ApiProperty({ description: 'Whether this identifier is verified' })
  @Expose()
  isVerified!: boolean;

  @ApiProperty({ description: 'Verification timestamp' })
  @Expose()
  verifiedAt!: Date | null;

  @ApiProperty({ description: 'Creation timestamp' })
  @Expose()
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  updatedAt!: Date;

  static fromEntity(entity: any): AccountIdentifierResponseDto {
    return plainToInstance(AccountIdentifierResponseDto, entity, {
      excludeExtraneousValues: false,
    });
  }
}
