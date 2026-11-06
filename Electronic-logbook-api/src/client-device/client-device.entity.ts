import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { SyncOperation } from '../sync-operation/sync-operation.entity';

import { EntityName } from '../constants/enums/entity-name.enum';

@Entity(EntityName.CLIENT_DEVICES)
export class ClientDevice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Logical reference only — no FK to identity-db. */
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'device_id', type: 'varchar', length: 255, unique: true })
  deviceId!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  platform!: string | null;

  @Column({ name: 'app_version', type: 'varchar', length: 50, nullable: true })
  appVersion!: string | null;

  @Column({ name: 'last_sync_at', type: 'timestamptz', nullable: true })
  lastSyncAt!: Date | null;

  @Column({ name: 'last_seen_at', type: 'timestamptz', nullable: true })
  lastSeenAt!: Date | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  status!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  // ── Relationships ───────────────────────────────────────────────
  @OneToMany(() => SyncOperation, (operation) => operation.device)
  syncOperations?: SyncOperation[];
}
