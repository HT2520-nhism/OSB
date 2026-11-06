import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { IsString } from 'class-validator';

import { EntityName } from '../constants/enums/entity-name.enum';
import { DateTransformer } from '../constants/transformers/date.transformer';
import { CompanyEntity } from '../company/company.entity';

@Entity(EntityName.DEPARTMENT)
@Index(['company', 'name'], { unique: true })
export class DepartmentEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column()
  @IsString()
  name!: string;

  @ManyToOne(() => CompanyEntity, (c) => c.departments, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'company_id' })
  company!: CompanyEntity;

  @CreateDateColumn({ name: 'created_at', transformer: new DateTransformer() })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', transformer: new DateTransformer() })
  updatedAt!: Date;
}
