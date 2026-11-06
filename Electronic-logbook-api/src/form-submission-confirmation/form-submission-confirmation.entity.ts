import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { FormSubmission } from '../form-submission/form-submission.entity';

import { EntityName } from '../constants/enums/entity-name.enum';

@Entity(EntityName.FORM_SUBMISSION_CONFIRMATIONS)
export class FormSubmissionConfirmation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ name: 'form_submission_id', type: 'uuid' })
  formSubmissionId!: string;

  /** Logical reference only — no FK to identity-db. */
  @Column({ name: 'confirmed_by', type: 'uuid' })
  confirmedBy!: string;

  @Column({
    name: 'confirmation_type',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  confirmationType!: string | null;

  @Column({ name: 'confirmed_at', type: 'timestamptz', nullable: true })
  confirmedAt!: Date | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 100, nullable: true })
  ipAddress!: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  // ── Relationships (1:1) ─────────────────────────────────────────
  @OneToOne(() => FormSubmission, (submission) => submission.confirmation, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'form_submission_id' })
  formSubmission?: FormSubmission;
}
