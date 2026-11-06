/**
 * PHASE 8 — Attachment Entity (DEPRECATED — superseded by Document Service).
 *
 * In Phase 8, generic file storage moved to a separate Document Service.
 * The Attachment table is preserved for backward compatibility but new
 * attachments should reference documents via:
 *
 *   Document Service
 *     - owner_service = 'electronic-logbook'
 *     - owner_type    = 'fishing_trip' | 'form_submission' | 'incident' | ...
 *     - owner_id      = <business entity UUID>
 *
 * The `documentId` field below is a logical reference (no FK).
 * Do not introduce any new code that writes binary files into the
 * eLogbook database.
 */

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Vessel } from '../vessel/vessel.entity';
import { FishingTrip } from '../fishing-trip/fishing-trip.entity';
import { FormSubmission } from '../form-submission/form-submission.entity';

import { EntityName } from '../constants/enums/entity-name.enum';

@Entity(EntityName.ATTACHMENTS)
@Index(['vesselId'])
@Index(['fishingTripId'])
@Index(['formSubmissionId'])
@Index(['incidentId'])
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * PHASE 8 — Logical reference to the canonical Document Service.
   * `null` for legacy attachments written before the Document Service existed.
   */
  @Column({ name: 'document_id', type: 'uuid', nullable: true })
  documentId!: string | null;

  /** Logical reference only — no FK to identity-db. */
  @Column({ name: 'owner_user_id', type: 'uuid', nullable: true })
  ownerUserId!: string | null;

  @Column({ name: 'vessel_id', type: 'uuid', nullable: true })
  vesselId!: string | null;

  @Column({ name: 'fishing_trip_id', type: 'uuid', nullable: true })
  fishingTripId!: string | null;

  @Column({ name: 'form_submission_id', type: 'uuid', nullable: true })
  formSubmissionId!: string | null;

  @Column({ name: 'incident_id', type: 'uuid', nullable: true })
  incidentId!: string | null;

  @Column({ name: 'file_name', type: 'varchar', length: 255, nullable: true })
  fileName!: string | null;

  @Column({ name: 'file_type', type: 'varchar', length: 100, nullable: true })
  fileType!: string | null;

  @Column({ name: 'mime_type', type: 'varchar', length: 100, nullable: true })
  mimeType!: string | null;

  @Column({ name: 'file_size', type: 'bigint', nullable: true })
  fileSize!: string | null;

  @Column({
    name: 'storage_provider',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  storageProvider!: string | null;

  @Column({ name: 'storage_key', type: 'text', nullable: true })
  storageKey!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  checksum!: string | null;

  /** Logical reference only — no FK to identity-db. */
  @Column({ name: 'uploaded_by', type: 'uuid' })
  uploadedBy!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  // ── Relationships ───────────────────────────────────────────────
  @ManyToOne(() => Vessel, (vessel) => vessel.attachments, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'vessel_id' })
  vessel?: Vessel;

  @ManyToOne(() => FishingTrip, (trip) => trip.attachments, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'fishing_trip_id' })
  fishingTrip?: FishingTrip;

  @ManyToOne(() => FormSubmission, (submission) => submission.attachments, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'form_submission_id' })
  formSubmission?: FormSubmission;
}
