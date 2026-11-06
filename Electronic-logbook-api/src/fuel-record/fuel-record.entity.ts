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

@Entity(EntityName.FUEL_RECORDS)
@Index(['fishingTripId'])
export class FuelRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'fishing_trip_id', type: 'uuid' })
  fishingTripId!: string;

  @Column({ name: 'record_type', type: 'varchar', length: 30, nullable: true })
  recordType!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 3, nullable: true })
  quantity!: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  unit!: string | null;

  @Column({ name: 'occurred_at', type: 'timestamptz', nullable: true })
  occurredAt!: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  /** Logical reference only — no FK to identity-db. */
  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  // ── Relationships ───────────────────────────────────────────────
  @ManyToOne(() => FishingTrip, (trip) => trip.fuelRecords, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'fishing_trip_id' })
  fishingTrip?: FishingTrip;
}
