import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

import { AccountRoleEntity } from '../account-role/account-role.entity';
import { EntityName } from '../constants/enums/entity-name.enum';

@Entity(EntityName.ROLE)
export class RoleEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
  })
  code!: string;

  @Column({
    type: 'varchar',
    length: 100,
  })
  name!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description?: string;

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

  @OneToMany(() => AccountRoleEntity, (accountRole) => accountRole.role)
  accountRoles!: AccountRoleEntity[];
}
