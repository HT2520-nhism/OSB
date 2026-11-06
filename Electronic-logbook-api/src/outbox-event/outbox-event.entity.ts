/**
 * PHASE 7 — Outbox Event entity.
 *
 * Schema is reused from Phase 2 (outbox_events table). The columns added
 * in Phase 7 live in a TypeORM migration.
 *
 * Note: there is intentionally NO controller. The outbox is an
 * infrastructure table; clients MUST NOT perform arbitrary CRUD on it.
 */

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { EntityName } from '../constants/enums/entity-name.enum';

@Entity(EntityName.OUTBOX_EVENTS)
@Index('IDX_OUTBOX_POLL', ['status', 'availableAt', 'createdAt'])
@Index('IDX_OUTBOX_AGGREGATE', ['aggregateType', 'aggregateId', 'createdAt'])
export class OutboxEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ name: 'event_id', type: 'uuid' })
  eventId!: string;

  @Column({
    name: 'aggregate_type',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  aggregateType!: string | null;

  @Column({ name: 'aggregate_id', type: 'uuid', nullable: true })
  aggregateId!: string | null;

  @Column({ name: 'event_type', type: 'varchar', length: 150, nullable: true })
  eventType!: string | null;

  /** Domain event payload — used by consumers. */
  @Column({ type: 'jsonb' })
  payload!: Record<string, unknown>;

  @Column({ type: 'varchar', length: 30, nullable: true })
  status!: string | null;

  @Column({ name: 'retry_count', type: 'integer', default: 0 })
  retryCount!: number;

  @Column({ name: 'available_at', type: 'timestamptz', nullable: true })
  availableAt!: Date | null;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  // ───── Phase 7 columns ─────────────────────────────────────────
  @Column({ name: 'correlation_id', type: 'uuid', nullable: true })
  correlationId!: string | null;

  @Column({ name: 'causation_id', type: 'uuid', nullable: true })
  causationId!: string | null;

  @Column({ name: 'event_version', type: 'integer', default: 1 })
  eventVersion!: number;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError!: string | null;

  @Column({ name: 'last_error_at', type: 'timestamptz', nullable: true })
  lastErrorAt!: Date | null;

  @Column({ name: 'claimed_by', type: 'varchar', length: 255, nullable: true })
  claimedBy!: string | null;

  @Column({ name: 'claimed_at', type: 'timestamptz', nullable: true })
  claimedAt!: Date | null;
}
