import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { FormSubmission } from '../form-submission/form-submission.entity';

import { EntityName } from '../constants/enums/entity-name.enum';

@Entity(EntityName.FORM_SUBMISSION_VERSIONS)
@Index(['formSubmissionId'])
export class FormSubmissionVersion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'form_submission_id', type: 'uuid' })
  formSubmissionId!: string;

  @Column({ type: 'integer' })
  version!: number;

  @Column({ type: 'jsonb' })
  data!: Record<string, unknown>;

  @Column({ type: 'varchar', length: 30, nullable: true })
  status!: string | null;

  /** Logical reference only — no FK to identity-db. */
  @Column({ name: 'changed_by', type: 'uuid' })
  changedBy!: string;

  @Column({
    name: 'change_reason',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  changeReason!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  // ── Relationships ───────────────────────────────────────────────
  @ManyToOne(() => FormSubmission, (submission) => submission.versions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'form_submission_id' })
  formSubmission?: FormSubmission;
}
