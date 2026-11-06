import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import { AccountEntity } from '../account/account.entity';
import { RoleEntity } from '../role/role.entity';
import { EntityName } from '../constants/enums/entity-name.enum';

@Entity(EntityName.ACCOUNT_ROLE)
@Index(['roleId'])
@Index(['accountId'])
export class AccountRoleEntity {
  @PrimaryColumn({
    name: 'account_id',
    type: 'uuid',
  })
  accountId!: string;

  @PrimaryColumn({
    name: 'role_id',
    type: 'uuid',
  })
  roleId!: string;

  @Column({
    name: 'assigned_at',
    type: 'timestamptz',
  })
  assignedAt!: Date;

  @Column({
    name: 'assigned_by',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  assignedBy?: string;

  @ManyToOne(() => AccountEntity, (account) => account.accountRoles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'account_id' })
  account!: AccountEntity;

  @ManyToOne(() => RoleEntity, (role) => role.accountRoles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id' })
  role!: RoleEntity;
}
