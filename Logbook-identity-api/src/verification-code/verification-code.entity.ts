import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import { VerificationPurpose } from '../constants/enums/verification-purpose.enum';
import { VerificationChannel } from '../constants/enums/verification-channel.enum';
import { AccountEntity } from '../account/account.entity';
import { AccountIdentifierEntity } from '../account-identifier/account-identifier.entity';
import { EntityName } from '../constants/enums/entity-name.enum';

@Entity(EntityName.VERIFICATION_CODE)
@Index(['accountId'])
@Index(['identifierId'])
@Index(['purpose'])
@Index(['expiresAt'])
@Index(['verifiedAt'])
export class VerificationCodeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'account_id',
    type: 'uuid',
    nullable: true,
  })
  accountId?: string;

  @Column({
    name: 'identifier_id',
    type: 'uuid',
    nullable: true,
  })
  identifierId?: string;

  @Column({
    type: 'enum',
    enum: VerificationPurpose,
    enumName: 'verification_purpose_enum',
  })
  purpose!: VerificationPurpose;

  @Column({
    type: 'enum',
    enum: VerificationChannel,
    enumName: 'verification_channel_enum',
  })
  channel!: VerificationChannel;

  @Column({
    name: 'code_hash',
    type: 'varchar',
    length: 255,
  })
  codeHash!: string;

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
    name: 'attempt_count',
    type: 'int',
    default: 0,
  })
  attemptCount!: number;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt!: Date;

  @ManyToOne(() => AccountEntity, (account) => account.verificationCodes, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'account_id' })
  account?: AccountEntity;

  @ManyToOne(
    () => AccountIdentifierEntity,
    (identifier) => identifier.verificationCodes,
    {
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({ name: 'identifier_id' })
  identifier?: AccountIdentifierEntity;
}
