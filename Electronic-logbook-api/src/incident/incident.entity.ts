import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Vessel } from '../vessel/vessel.entity';
import { FishingTrip } from '../fishing-trip/fishing-trip.entity';

import { EntityName } from '../constants/enums/entity-name.enum';

@Entity(EntityName.INCIDENTS)
@Index(['vesselId'])
@Index(['fishingTripId'])
export class Incident {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'fishing_trip_id', type: 'uuid', nullable: true })
  fishingTripId!: string | null;

  @Column({ name: 'vessel_id', type: 'uuid' })
  vesselId!: string;

  @Column({
    name: 'incident_type',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  incidentType!: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  severity!: string | null;

  @Column({ name: 'occurred_at', type: 'timestamptz', nullable: true })
  occurredAt!: Date | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'action_taken', type: 'text', nullable: true })
  actionTaken!: string | null;

  /** Logical reference only — no FK to identity-db. */
  @Column({ name: 'reported_by', type: 'uuid' })
  reportedBy!: string;

  /** Owner ID - denormalized for fast filtering (user who owns/is responsible for this incident) */
  @Column({ name: 'owner_id', type: 'uuid', nullable: true })
  ownerId!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  // ── Relationships ───────────────────────────────────────────────
  @ManyToOne(() => Vessel, (vessel) => vessel.incidents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'vessel_id' })
  vessel?: Vessel;

  @ManyToOne(() => FishingTrip, (trip) => trip.incidents, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'fishing_trip_id' })
  fishingTrip?: FishingTrip;
}
