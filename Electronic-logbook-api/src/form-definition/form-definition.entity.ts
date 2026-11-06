import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { FormSubmission } from '../form-submission/form-submission.entity';

import { EntityName } from '../constants/enums/entity-name.enum';

@Entity(EntityName.FORM_DEFINITIONS)
export class FormDefinition {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ name: 'form_code', type: 'varchar', length: 100 })
  formCode!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  version!: string | null;

  @Column({ name: 'form_type', type: 'varchar', length: 50, nullable: true })
  formType!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'effective_from', type: 'timestamptz', nullable: true })
  effectiveFrom!: Date | null;

  @Column({ name: 'effective_to', type: 'timestamptz', nullable: true })
  effectiveTo!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  // ── Relationships ───────────────────────────────────────────────
  @OneToMany(() => FormSubmission, (submission) => submission.formDefinition)
  submissions?: FormSubmission[];
}
