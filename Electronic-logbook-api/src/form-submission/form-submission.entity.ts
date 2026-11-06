import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Vessel } from '../vessel/vessel.entity';
import { FishingTrip } from '../fishing-trip/fishing-trip.entity';
import { FormDefinition } from '../form-definition/form-definition.entity';
import { FormSubmissionData } from '../form-submission-data/form-submission-data.entity';
import { FormSubmissionVersion } from '../form-submission-version/form-submission-version.entity';
import { FormWorkflowHistory } from '../form-workflow-history/form-workflow-history.entity';
import { FormSubmissionConfirmation } from '../form-submission-confirmation/form-submission-confirmation.entity';
import { Attachment } from '../attachment/attachment.entity';

import { EntityName } from '../constants/enums/entity-name.enum';

@Entity(EntityName.FORM_SUBMISSIONS)
@Index(['formDefinitionId'])
@Index(['vesselId'])
@Index(['fishingTripId'])
export class FormSubmission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'form_definition_id', type: 'uuid' })
  formDefinitionId!: string;

  @Column({ name: 'fishing_trip_id', type: 'uuid', nullable: true })
  fishingTripId!: string | null;

  @Column({ name: 'vessel_id', type: 'uuid' })
  vesselId!: string;

  /** Logical reference only — no FK to identity-db. */
  @Column({ name: 'submitted_by', type: 'uuid' })
  submittedBy!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  status!: string | null;

  @Column({ type: 'integer', default: 1 })
  version!: number;

  @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true })
  submittedAt!: Date | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt!: Date | null;

  @Column({ name: 'rejected_at', type: 'timestamptz', nullable: true })
  rejectedAt!: Date | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => FormDefinition, (def) => def.submissions, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'form_definition_id' })
  formDefinition?: FormDefinition;

  @ManyToOne(() => Vessel, (vessel) => vessel.formSubmissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'vessel_id' })
  vessel?: Vessel;

  @ManyToOne(() => FishingTrip, (trip) => trip.formSubmissions, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'fishing_trip_id' })
  fishingTrip?: FishingTrip;

  @OneToOne(() => FormSubmissionData, (data) => data.formSubmission)
  data?: FormSubmissionData;

  @OneToMany(() => FormSubmissionVersion, (version) => version.formSubmission)
  versions?: FormSubmissionVersion[];

  @OneToMany(() => FormWorkflowHistory, (history) => history.formSubmission)
  workflowHistories?: FormWorkflowHistory[];

  @OneToOne(
    () => FormSubmissionConfirmation,
    (confirmation) => confirmation.formSubmission,
  )
  confirmation?: FormSubmissionConfirmation;

  @OneToMany(() => Attachment, (attachment) => attachment.formSubmission)
  attachments?: Attachment[];
}
