import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';

import { IdentifierType } from '../constants/enums/identifier-type.enum';
import { AccountEntity } from '../account/account.entity';
import { VerificationCodeEntity } from '../verification-code/verification-code.entity';
import { PasswordResetRequestEntity } from '../password-reset-request/password-reset-request.entity';
import { EntityName } from '../constants/enums/entity-name.enum';

@Entity(EntityName.ACCOUNT_IDENTIFIER)
@Index(['accountId'])
@Index(['type'])
@Index(['isPrimary'])
@Index(['isVerified'])
@Unique(['type', 'normalizedValue'])
export class AccountIdentifierEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'account_id',
    type: 'uuid',
  })
  accountId!: string;

  @Column({
    type: 'enum',
    enum: IdentifierType,
    enumName: 'identifier_type_enum',
  })
  type!: IdentifierType;

  @Column({
    type: 'varchar',
    length: 255,
  })
  value!: string;

  @Column({
    name: 'normalized_value',
    type: 'varchar',
    length: 255,
  })
  normalizedValue!: string;

  @Column({
    name: 'is_primary',
    type: 'boolean',
    default: false,
  })
  isPrimary!: boolean;

  @Column({
    name: 'is_verified',
    type: 'boolean',
    default: false,
  })
  isVerified!: boolean;

  @Column({
    name: 'verified_at',
    type: 'timestamptz',
    nullable: true,
  })
  verifiedAt?: Date;

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

  @ManyToOne(() => AccountEntity, (account) => account.identifiers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'account_id' })
  account!: AccountEntity;

  @OneToMany(() => VerificationCodeEntity, (code) => code.identifier)
  verificationCodes!: VerificationCodeEntity[];

  @OneToMany(() => PasswordResetRequestEntity, (request) => request.identifier)
  passwordResetRequests!: PasswordResetRequestEntity[];
}
