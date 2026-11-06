import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsEnum } from 'class-validator';

import { EntityName } from '../constants/enums/entity-name.enum';
import { DateTransformer } from '../constants/transformers/date.transformer';
import { DepartmentEntity } from '../departments/department.entity';
import { BackofficeRole } from '../constants/enums/backoffice-role.enum';
import { UserEntity } from '../user/user.entity';

type SelectFields =
  | keyof BackofficeRoleEntity
  | 'department.id'
  | 'department.name'
  | 'department.company.id'
  | 'department.company.name'
  | 'users.id'
  | 'users.firstName'
  | 'users.lastName'
  | 'users.email';

export const DEFAULT_SELECTED_FIELDS: SelectFields[] = [
  'id',
  'role',
  'department.id',
  'department.name',
  'department.company.id',
  'department.company.name',
];

@Entity(EntityName.BACKOFFICE_ROLE)
@Index('department_role_unique', ['department.id', 'role'], { unique: true })
export class BackofficeRoleEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @CreateDateColumn({
    name: 'created_at',
    transformer: new DateTransformer(),
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    transformer: new DateTransformer(),
  })
  updatedAt: Date;

  @Column({
    type: 'enum',
    enum: BackofficeRole,
  })
  @IsEnum(BackofficeRole)
  role: BackofficeRole;

  @ManyToOne(() => DepartmentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'department_id', referencedColumnName: 'id' })
  department: DepartmentEntity;

  @ManyToMany(() => UserEntity, (user) => user.backofficeRoles, {
    onDelete: 'CASCADE',
  })
  users?: UserEntity[];
}
