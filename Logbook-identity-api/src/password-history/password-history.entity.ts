import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import { PasswordChangeReason } from '../constants/enums/password-change-reason.enum';
import { AccountEntity } from '../account/account.entity';
import { EntityName } from '../constants/enums/entity-name.enum';

@Entity(EntityName.PASSWORD_HISTORY)
@Index(['accountId'])
@Index(['createdAt'])
export class PasswordHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'account_id',
    type: 'uuid',
  })
  accountId!: string;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
  })
  passwordHash!: string;

  @Column({
    name: 'change_reason',
    type: 'enum',
    enum: PasswordChangeReason,
    enumName: 'password_change_reason_enum',
  })
  changeReason!: PasswordChangeReason;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt!: Date;

  @ManyToOne(() => AccountEntity, (account) => account.passwordHistories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'account_id' })
  account!: AccountEntity;
}
