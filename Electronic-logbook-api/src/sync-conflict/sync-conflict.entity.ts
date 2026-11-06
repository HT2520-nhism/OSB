import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { SyncOperation } from '../sync-operation/sync-operation.entity';

import { EntityName } from '../constants/enums/entity-name.enum';

@Entity(EntityName.SYNC_CONFLICTS)
@Index(['syncOperationId'])
export class SyncConflict {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'sync_operation_id', type: 'uuid' })
  syncOperationId!: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 100, nullable: true })
  entityType!: string | null;

  @Column({ name: 'entity_id', type: 'uuid', nullable: true })
  entityId!: string | null;

  @Column({ name: 'client_data', type: 'jsonb', nullable: true })
  clientData!: Record<string, unknown> | null;

  @Column({ name: 'server_data', type: 'jsonb', nullable: true })
  serverData!: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  resolution!: string | null;

  /** Logical reference only — no FK to identity-db. */
  @Column({ name: 'resolved_by', type: 'uuid', nullable: true })
  resolvedBy!: string | null;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  // ── Relationships ───────────────────────────────────────────────
  @ManyToOne(() => SyncOperation, (op) => op.conflicts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sync_operation_id' })
  syncOperation?: SyncOperation;
}
