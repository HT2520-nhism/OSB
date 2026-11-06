import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import { IdentityDocumentType } from '../constants/enums/identity-document-type.enum';
import { ProfileStatus } from '../constants/enums/profile-status.enum';
import { AccountEntity } from '../account/account.entity';
import { EntityName } from '../constants/enums/entity-name.enum';

@Entity(EntityName.FISHERMAN_PROFILE)
@Index(['identityDocumentNumber'])
@Index(['provinceCode'])
@Index(['districtCode'])
@Index(['wardCode'])
@Index(['profileStatus'])
export class FishermanProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'account_id',
    type: 'uuid',
    unique: true,
  })
  accountId!: string;

  @Column({
    name: 'full_name',
    type: 'varchar',
    length: 255,
  })
  fullName!: string;

  @Column({
    name: 'date_of_birth',
    type: 'date',
    nullable: true,
  })
  dateOfBirth?: Date;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  gender?: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  nationality?: string;

  @Column({
    name: 'place_of_birth',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  placeOfBirth?: string;

  @Column({
    name: 'identity_document_type',
    type: 'enum',
    enum: IdentityDocumentType,
    enumName: 'identity_document_type_enum',
    nullable: true,
  })
  identityDocumentType?: IdentityDocumentType;

  @Column({
    name: 'identity_document_number',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  identityDocumentNumber?: string;

  @Column({
    name: 'identity_document_issued_date',
    type: 'date',
    nullable: true,
  })
  identityDocumentIssuedDate?: Date;

  @Column({
    name: 'identity_document_issued_place',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  identityDocumentIssuedPlace?: string;

  @Column({
    name: 'identity_document_expiry_date',
    type: 'date',
    nullable: true,
  })
  identityDocumentExpiryDate?: Date;

  @Column({
    name: 'address_line',
    type: 'text',
    nullable: true,
  })
  addressLine?: string;

  @Column({
    name: 'province_code',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  provinceCode?: string;

  @Column({
    name: 'district_code',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  districtCode?: string;

  @Column({
    name: 'ward_code',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  wardCode?: string;

  @Column({
    name: 'emergency_contact_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  emergencyContactName?: string;

  @Column({
    name: 'emergency_contact_phone',
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  emergencyContactPhone?: string;

  @Column({
    name: 'profile_status',
    type: 'enum',
    enum: ProfileStatus,
    enumName: 'profile_status_enum',
    default: ProfileStatus.INCOMPLETE,
  })
  profileStatus!: ProfileStatus;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
  })
  updatedAt!: Date;

  @OneToOne(() => AccountEntity, (account) => account.fishermanProfile, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'account_id' })
  account!: AccountEntity;
}
