import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import { PasswordResetStatus } from '../constants/enums/password-reset-status.enum';
import { EntityName } from '../constants/enums/entity-name.enum';
import { AccountEntity } from '../account/account.entity';
import { AccountIdentifierEntity } from '../account-identifier/account-identifier.entity';
import { VerificationCodeEntity } from '../verification-code/verification-code.entity';

@Entity(EntityName.PASSWORD_RESET_REQUEST)
@Index(['accountId'])
@Index(['identifierId'])
@Index(['verificationCodeId'])
@Index(['status'])
@Index(['expiresAt'])
export class PasswordResetRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'account_id',
    type: 'uuid',
  })
  accountId!: string;

  @Column({
    name: 'identifier_id',
    type: 'uuid',
  })
  identifierId!: string;

  @Column({
    name: 'verification_code_id',
    type: 'uuid',
  })
  verificationCodeId!: string;

  @Column({
    name: 'reset_token_hash',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  resetTokenHash?: string;

  @Column({
    type: 'enum',
    enum: PasswordResetStatus,
    enumName: 'password_reset_status_enum',
  })
  status!: PasswordResetStatus;

  @Column({
    name: 'expires_at',
    type: 'timestamptz',
  })
  expiresAt!: Date;

  @Column({
    name: 'verified_at',
    type: 'timestamptz',
    nullable: true,
  })
  verifiedAt?: Date;

  @Column({
    name: 'completed_at',
    type: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  @Column({
    name: 'revoked_at',
    type: 'timestamptz',
    nullable: true,
  })
  revokedAt?: Date;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt!: Date;

  @ManyToOne(() => AccountEntity, (account) => account.passwordResetRequests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'account_id' })
  account!: AccountEntity;

  @ManyToOne(
    () => AccountIdentifierEntity,
    (identifier) => identifier.passwordResetRequests,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'identifier_id' })
  identifier!: AccountIdentifierEntity;

  @ManyToOne(() => VerificationCodeEntity, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'verification_code_id' })
  verificationCode!: VerificationCodeEntity;
}
