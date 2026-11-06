import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { FishingTrip } from '../fishing-trip/fishing-trip.entity';
import { CatchRecord } from '../catch-record/catch-record.entity';

import { EntityName } from '../constants/enums/entity-name.enum';

@Entity(EntityName.FISHING_OPERATIONS)
@Index(['fishingTripId'])
export class FishingOperation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'fishing_trip_id', type: 'uuid' })
  fishingTripId!: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude!: string | null;

  @Column({ name: 'operation_started_at', type: 'timestamptz', nullable: true })
  operationStartedAt!: Date | null;

  @Column({ name: 'operation_ended_at', type: 'timestamptz', nullable: true })
  operationEndedAt!: Date | null;

  @Column({
    name: 'operation_type',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  operationType!: string | null;

  @Column({
    name: 'fishing_gear_type',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  fishingGearType!: string | null;

  @Column({
    name: 'fishing_ground',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  fishingGround!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  depth!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  /** Logical reference only — no FK to identity-db. */
  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  // ── Relationships ───────────────────────────────────────────────
  @ManyToOne(() => FishingTrip, (trip) => trip.operations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'fishing_trip_id' })
  fishingTrip?: FishingTrip;

  @OneToMany(() => CatchRecord, (catchRecord) => catchRecord.fishingOperation)
  catchRecords?: CatchRecord[];
}
