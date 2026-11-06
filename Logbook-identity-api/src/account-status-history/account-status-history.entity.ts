import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import { AccountEntity } from '../account/account.entity';
import { EntityName } from '../constants/enums/entity-name.enum';

@Entity(EntityName.ACCOUNT_STATUS_HISTORY)
@Index(['accountId'])
@Index(['createdAt'])
@Index(['newStatus'])
export class AccountStatusHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'account_id',
    type: 'uuid',
  })
  accountId!: string;

  @Column({
    name: 'old_status',
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  oldStatus?: string;

  @Column({
    name: 'new_status',
    type: 'varchar',
    length: 30,
  })
  newStatus!: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  reason?: string;

  @Column({
    name: 'changed_by',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  changedBy?: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt!: Date;

  @ManyToOne(() => AccountEntity, (account) => account.statusHistories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'account_id' })
  account!: AccountEntity;
}
