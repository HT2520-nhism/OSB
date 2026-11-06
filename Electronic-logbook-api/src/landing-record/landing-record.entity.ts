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

import { FishingTrip } from '../fishing-trip/fishing-trip.entity';
import { LandingCatch } from '../landing-catch/landing-catch.entity';

import { EntityName } from '../constants/enums/entity-name.enum';

@Entity(EntityName.LANDING_RECORDS)
@Index(['fishingTripId'])
export class LandingRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'fishing_trip_id', type: 'uuid' })
  fishingTripId!: string;

  @Column({
    name: 'landing_port_code',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  landingPortCode!: string | null;

  @Column({ name: 'landed_at', type: 'timestamptz', nullable: true })
  landedAt!: Date | null;

  @Column({
    name: 'total_quantity',
    type: 'decimal',
    precision: 12,
    scale: 3,
    nullable: true,
  })
  totalQuantity!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  /** Logical reference only — no FK to identity-db. */
  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  // ── Relationships ───────────────────────────────────────────────
  @ManyToOne(() => FishingTrip, (trip) => trip.landings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'fishing_trip_id' })
  fishingTrip?: FishingTrip;

  @OneToMany(() => LandingCatch, (catchRecord) => catchRecord.landingRecord)
  catches?: LandingCatch[];
}
