import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  Allow,
  IsDate,
  IsEmail,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

import { EntityName } from '../constants/enums/entity-name.enum';
import { IsTrimmedStringWithoutTab } from '../constants/validators/trimmed-string-without-tab.validator';
import { DateTransformer } from '../constants/transformers/date.transformer';
import { Gender } from '../constants/enums/gender.enum';
import { DepartmentEntity } from '../departments/department.entity';
import { BackofficeRoleEntity } from '../backoffice-roles/backoffice-role.entity';
import { CompanyEntity } from '../company/company.entity';

export type SelectFields =
  | keyof UserEntity
  | 'department.name'
  | 'department.id'
  | 'company.name'
  | 'company.id'
  | 'backofficeRoles.id'
  | 'backofficeRoles.role'
  | 'backofficeRoles.department.name'
  | 'backofficeRoles.department.id';

export const BASIC_SELECTABLE_FIELDS: (keyof UserEntity)[] = [
  'id',
  'name',
  'email',
];

export const DEFAULT_SELECTED_FIELDS: SelectFields[] = [
  ...BASIC_SELECTABLE_FIELDS,
  'loginUsername',
  'gender',
  'email',
  'dateOfBirth',
  'phoneNumber',
  'department.id',
  'department.name',
  'company.id',
  'company.name',
  'backofficeRoles.id',
  'backofficeRoles.role',
];

export const SELECTABLE_FIELDS: SelectFields[] = [
  ...DEFAULT_SELECTED_FIELDS,
  'joinDate',
  'leaveDate',
  'dateOfBirth',
  'identityCardNumber',
  'taxNumber',
  'insuranceNumber',
  'gender',
  'updatedBy',
  'backofficeRoles.id',
  'backofficeRoles.role',
  'backofficeRoles.department.name',
  'backofficeRoles.department.id',
];

@Entity(EntityName.USER)
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  @IsOptional()
  @IsUUID()
  id!: string;

  @Column({
    nullable: false,
    name: 'name',
  })
  @IsTrimmedStringWithoutTab()
  name!: string;

  @Column({
    type: 'enum',
    enum: Gender,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @Column({
    unique: true,
  })
  @IsEmail()
  email!: string;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    nullable: true,
    select: false,
  })
  @IsOptional()
  @Allow()
  passwordHash?: string | null;

  @Column({
    name: 'login_username',
    type: 'varchar',
    nullable: true,
    unique: true,
  })
  @IsOptional()
  @IsString()
  loginUsername?: string | null;

  @Column({
    name: 'dob',
    type: 'timestamp',
    transformer: new DateTransformer(),
    nullable: true,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateOfBirth?: Date;

  @Column({
    name: 'phone_number',
    nullable: true,
  })
  @IsOptional()
  @IsPhoneNumber('VN')
  phoneNumber?: string;

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
    name: 'join_date',
    type: 'timestamp',
    transformer: new DateTransformer(),
    nullable: true,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  joinDate?: Date;

  @Column({
    name: 'leave_date',
    type: 'timestamp',
    transformer: new DateTransformer(),
    nullable: true,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  leaveDate?: Date;

  @Column({
    name: 'identity_card_number',
    nullable: true,
  })
  @IsOptional()
  @Matches(/^[0-9]{9,12}$/)
  identityCardNumber?: string;

  @Column({
    name: 'insurance_number',
    nullable: true,
  })
  @IsOptional()
  @Matches(/^[A-Z0-9]{15}$/)
  insuranceNumber?: string;

  @Column({
    name: 'tax_number',
    nullable: true,
  })
  @IsOptional()
  @Matches(/^([0-9]{10})(\-[0-9]{3}|)$/)
  taxNumber?: string;

  @Column({
    nullable: true,
  })
  @IsOptional()
  @IsTrimmedStringWithoutTab()
  position?: string;

  @Column({
    nullable: true,
    name: 'updated_by',
    type: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  updatedBy: string;

  @ManyToOne(() => CompanyEntity)
  @JoinColumn({ name: 'company_id', referencedColumnName: 'id' })
  company?: CompanyEntity;

  @ManyToOne(() => DepartmentEntity)
  @JoinColumn({ name: 'department_id', referencedColumnName: 'id' })
  department?: DepartmentEntity;

  @ManyToMany(() => BackofficeRoleEntity, (role) => role.users, {
    onDelete: 'CASCADE',
  })
  @JoinTable({
    name: 'users_backoffice_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: {
      name: 'backoffice_role_id',
      referencedColumnName: 'id',
    },
  })
  backofficeRoles?: BackofficeRoleEntity[];

  constructor(name, email) {
    this.name = name;
    this.email = email;
  }
}
