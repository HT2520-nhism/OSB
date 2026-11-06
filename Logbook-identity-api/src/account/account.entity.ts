import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  OneToMany,
  OneToOne,
} from 'typeorm';

import { AccountStatus } from '../constants/enums/account-status.enum';
import { AccountType } from '../constants/enums/account-type.enum';
import { SystemRole } from '../constants/enums/system-role.enum';
import { AccountIdentifierEntity } from '../account-identifier/account-identifier.entity';
import { FishermanProfileEntity } from '../fisherman-profile/fisherman-profile.entity';
import { AccountRoleEntity } from '../account-role/account-role.entity';
import { PasswordHistoryEntity } from '../password-history/password-history.entity';
import { VerificationCodeEntity } from '../verification-code/verification-code.entity';
import { PasswordResetRequestEntity } from '../password-reset-request/password-reset-request.entity';
import { LoginAttemptEntity } from '../login-attempt/login-attempt.entity';
import { SessionEntity } from '../session/session.entity';
import { AccountStatusHistoryEntity } from '../account-status-history/account-status-history.entity';
import { EntityName } from '../constants/enums/entity-name.enum';

@Entity(EntityName.ACCOUNT)
@Index(['status'])
@Index(['accountType'])
@Index(['systemRole'])
@Index(['lastLoginAt'])
export class AccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: AccountStatus,
    enumName: 'account_status_enum',
    default: AccountStatus.PENDING,
  })
  status!: AccountStatus;

  @Column({
    name: 'account_type',
    type: 'enum',
    enum: AccountType,
    enumName: 'account_type_enum',
  })
  accountType!: AccountType;

  /**
   * System-level role for Electronic Logbook authorization.
   * Stored here (logbook-identity-api) and embedded in JWT so downstream
   * services can enforce it without additional DB lookups.
   *
   * Default: USER — no administrative privileges.
   */
  @Column({
    name: 'system_role',
    type: 'enum',
    enum: SystemRole,
    enumName: 'system_role_enum',
    default: SystemRole.USER,
  })
  systemRole!: SystemRole;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  passwordHash?: string;

  @Column({
    name: 'password_changed_at',
    type: 'timestamptz',
    nullable: true,
  })
  passwordChangedAt?: Date;

  @Column({
    name: 'last_login_at',
    type: 'timestamptz',
    nullable: true,
  })
  lastLoginAt?: Date;

  @Column({
    name: 'failed_login_attempts',
    type: 'int',
    default: 0,
  })
  failedLoginAttempts!: number;

  @Column({
    name: 'locked_until',
    type: 'timestamptz',
    nullable: true,
  })
  lockedUntil?: Date;

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

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamptz',
    nullable: true,
  })
  deletedAt?: Date;

  @OneToMany(() => AccountIdentifierEntity, (identifier) => identifier.account)
  identifiers!: AccountIdentifierEntity[];

  @OneToOne(() => FishermanProfileEntity, (profile) => profile.account)
  fishermanProfile!: FishermanProfileEntity;

  @OneToMany(() => AccountRoleEntity, (accountRole) => accountRole.account)
  accountRoles!: AccountRoleEntity[];

  @OneToMany(() => PasswordHistoryEntity, (history) => history.account)
  passwordHistories!: PasswordHistoryEntity[];

  @OneToMany(() => VerificationCodeEntity, (code) => code.account)
  verificationCodes!: VerificationCodeEntity[];

  @OneToMany(() => PasswordResetRequestEntity, (request) => request.account)
  passwordResetRequests!: PasswordResetRequestEntity[];

  @OneToMany(() => LoginAttemptEntity, (attempt) => attempt.account)
  loginAttempts!: LoginAttemptEntity[];

  @OneToMany(() => SessionEntity, (session) => session.account)
  sessions!: SessionEntity[];

  @OneToMany(() => AccountStatusHistoryEntity, (history) => history.account)
  statusHistories!: AccountStatusHistoryEntity[];
}
