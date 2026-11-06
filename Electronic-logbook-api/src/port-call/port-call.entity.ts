import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { FishingTrip } from '../fishing-trip/fishing-trip.entity';

import { EntityName } from '../constants/enums/entity-name.enum';

@Entity(EntityName.PORT_CALLS)
@Index(['fishingTripId'])
export class PortCall {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'fishing_trip_id', type: 'uuid' })
  fishingTripId!: string;

  @Column({ name: 'port_code', type: 'varchar', length: 100, nullable: true })
  portCode!: string | null;

  @Column({ name: 'call_type', type: 'varchar', length: 30, nullable: true })
  callType!: string | null;

  @Column({ name: 'occurred_at', type: 'timestamptz', nullable: true })
  occurredAt!: Date | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  /** Logical reference only — no FK to identity-db. */
  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  // ── Relationships ───────────────────────────────────────────────
  @ManyToOne(() => FishingTrip, (trip) => trip.portCalls, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'fishing_trip_id' })
  fishingTrip?: FishingTrip;
}
