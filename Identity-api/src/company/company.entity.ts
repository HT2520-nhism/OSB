import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsEnum, IsString } from 'class-validator';

import { EntityName } from '../constants/enums/entity-name.enum';
import { CompanyType } from '../constants/enums/company-type.enum';
import { DateTransformer } from '../constants/transformers/date.transformer';
import { DepartmentEntity } from '../departments/department.entity';
import { UserEntity } from '../user/user.entity';

@Entity(EntityName.COMPANY)
export class CompanyEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ unique: true, nullable: false })
  @IsString()
  name!: string;

  @Column({ type: 'enum', enum: CompanyType, nullable: false })
  @IsEnum(CompanyType)
  type!: CompanyType;

  @Column({ name: 'parent_company_id', nullable: true })
  parentCompanyId?: number;

  @ManyToOne(() => CompanyEntity, (c) => c.children, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parent_company_id' })
  parentCompany?: CompanyEntity;

  @OneToMany(() => CompanyEntity, (c) => c.parentCompany)
  children?: CompanyEntity[];

  @OneToMany(() => DepartmentEntity, (d) => d.company)
  departments?: DepartmentEntity[];

  @OneToMany(() => UserEntity, (u) => u.company)
  users?: UserEntity[];

  @CreateDateColumn({
    name: 'created_at',
    transformer: new DateTransformer(),
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    transformer: new DateTransformer(),
  })
  updatedAt!: Date;
}
