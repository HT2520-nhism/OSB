import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ClientDevice } from '../client-device/client-device.entity';
import { SyncConflict } from '../sync-conflict/sync-conflict.entity';

import { EntityName } from '../constants/enums/entity-name.enum';

@Entity(EntityName.SYNC_OPERATIONS)
@Index(['deviceId'])
export class SyncOperation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'device_id', type: 'uuid' })
  deviceId!: string;

  /** Logical reference only — no FK to identity-db. */
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Index({ unique: true })
  @Column({ name: 'operation_id', type: 'varchar', length: 255 })
  operationId!: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 100, nullable: true })
  entityType!: string | null;

  @Column({ name: 'entity_id', type: 'uuid', nullable: true })
  entityId!: string | null;

  @Column({
    name: 'operation_type',
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  operationType!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  payload!: Record<string, unknown> | null;

  @Column({ name: 'client_version', type: 'integer', nullable: true })
  clientVersion!: number | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  status!: string | null;

  @Column({ name: 'error_code', type: 'varchar', length: 100, nullable: true })
  errorCode!: string | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt!: Date | null;

  // ── Relationships ───────────────────────────────────────────────
  @ManyToOne(() => ClientDevice, (device) => device.syncOperations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'device_id' })
  device?: ClientDevice;

  @OneToMany(() => SyncConflict, (conflict) => conflict.syncOperation)
  conflicts?: SyncConflict[];
}
