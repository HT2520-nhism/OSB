import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import { LoginIdentifierType } from '../constants/enums/login-identifier-type.enum';
import { LoginFailureReason } from '../constants/enums/login-failure-reason.enum';
import { AccountEntity } from '../account/account.entity';
import { EntityName } from '../constants/enums/entity-name.enum';

@Entity(EntityName.LOGIN_ATTEMPT)
@Index(['accountId'])
@Index(['identifierValue'])
@Index(['success'])
@Index(['createdAt'])
export class LoginAttemptEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'account_id',
    type: 'uuid',
    nullable: true,
  })
  accountId?: string;

  @Column({
    name: 'identifier_type',
    type: 'enum',
    enum: LoginIdentifierType,
    enumName: 'login_identifier_type_enum',
  })
  identifierType!: LoginIdentifierType;

  @Column({
    name: 'identifier_value',
    type: 'varchar',
    length: 255,
  })
  identifierValue!: string;

  @Column({
    type: 'boolean',
  })
  success!: boolean;

  @Column({
    name: 'failure_reason',
    type: 'enum',
    enum: LoginFailureReason,
    enumName: 'login_failure_reason_enum',
    nullable: true,
  })
  failureReason?: LoginFailureReason;

  @Column({
    name: 'ip_address',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  ipAddress?: string;

  @Column({
    name: 'device_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  deviceId?: string;

  @Column({
    name: 'user_agent',
    type: 'text',
    nullable: true,
  })
  userAgent?: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt!: Date;

  @ManyToOne(() => AccountEntity, (account) => account.loginAttempts, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'account_id' })
  account?: AccountEntity;
}
