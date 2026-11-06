import { Exclude, Expose, plainToInstance } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

import { ProfileStatus } from '../../constants/enums/profile-status.enum';
import { IdentityDocumentType } from '../../constants/enums/identity-document-type.enum';

@Exclude()
export class FishermanProfileResponseDto {
  @ApiProperty({ description: 'Profile UUID' })
  @Expose()
  id!: string;

  @ApiProperty({ description: 'Account UUID' })
  @Expose()
  accountId!: string;

  @ApiProperty({ description: 'Full name' })
  @Expose()
  fullName!: string;

  @ApiProperty({ description: 'Date of birth' })
  @Expose()
  dateOfBirth!: Date | null;

  @ApiProperty({ description: 'Gender' })
  @Expose()
  gender!: string | null;

  @ApiProperty({ description: 'Nationality' })
  @Expose()
  nationality!: string | null;

  @ApiProperty({ description: 'Place of birth' })
  @Expose()
  placeOfBirth!: string | null;

  @ApiProperty({
    enum: IdentityDocumentType,
    description: 'Identity document type',
  })
  @Expose()
  identityDocumentType!: IdentityDocumentType | null;

  @ApiProperty({ description: 'Identity document number' })
  @Expose()
  identityDocumentNumber!: string | null;

  @ApiProperty({ description: 'Identity document issued date' })
  @Expose()
  identityDocumentIssuedDate!: Date | null;

  @ApiProperty({ description: 'Identity document issued place' })
  @Expose()
  identityDocumentIssuedPlace!: string | null;

  @ApiProperty({ description: 'Identity document expiry date' })
  @Expose()
  identityDocumentExpiryDate!: Date | null;

  @ApiProperty({ description: 'Address line' })
  @Expose()
  addressLine!: string | null;

  @ApiProperty({ description: 'Province code' })
  @Expose()
  provinceCode!: string | null;

  @ApiProperty({ description: 'District code' })
  @Expose()
  districtCode!: string | null;

  @ApiProperty({ description: 'Ward code' })
  @Expose()
  wardCode!: string | null;

  @ApiProperty({ description: 'Emergency contact name' })
  @Expose()
  emergencyContactName!: string | null;

  @ApiProperty({ description: 'Emergency contact phone' })
  @Expose()
  emergencyContactPhone!: string | null;

  @ApiProperty({ enum: ProfileStatus, description: 'Profile status' })
  @Expose()
  profileStatus!: ProfileStatus;

  @ApiProperty({ description: 'Creation timestamp' })
  @Expose()
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  updatedAt!: Date;

  static fromEntity(entity: any): FishermanProfileResponseDto {
    return plainToInstance(FishermanProfileResponseDto, entity, {
      excludeExtraneousValues: false,
    });
  }
}
