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

@Entity(EntityName.FORM_WORKFLOW_HISTORIES)
@Index(['formSubmissionId'])
export class FormWorkflowHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'form_submission_id', type: 'uuid' })
  formSubmissionId!: string;

  @Column({ name: 'from_status', type: 'varchar', length: 30, nullable: true })
  fromStatus!: string | null;

  @Column({ name: 'to_status', type: 'varchar', length: 30, nullable: true })
  toStatus!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  action!: string | null;

  @Column({ type: 'text', nullable: true })
  reason!: string | null;

  /** Logical reference only — no FK to identity-db. */
  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  // ── Relationships ───────────────────────────────────────────────
  @ManyToOne(
    () => FormSubmission,
    (submission) => submission.workflowHistories,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'form_submission_id' })
  formSubmission?: FormSubmission;
}
