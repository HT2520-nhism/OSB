import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { FormSubmission } from '../form-submission/form-submission.entity';

import { EntityName } from '../constants/enums/entity-name.enum';

@Entity(EntityName.FORM_SUBMISSION_DATA)
export class FormSubmissionData {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ name: 'form_submission_id', type: 'uuid' })
  formSubmissionId!: string;

  @Column({ type: 'jsonb' })
  data!: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  // ── Relationships (1:1) ─────────────────────────────────────────
  @OneToOne(() => FormSubmission, (submission) => submission.data, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'form_submission_id' })
  formSubmission?: FormSubmission;
}
