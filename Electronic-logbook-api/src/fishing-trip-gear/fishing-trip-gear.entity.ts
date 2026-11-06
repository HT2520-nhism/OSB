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
import { FishingGear } from '../fishing-gear/fishing-gear.entity';

import { EntityName } from '../constants/enums/entity-name.enum';

@Entity(EntityName.FISHING_TRIP_GEARS)
@Index(['fishingTripId'])
export class FishingTripGear {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'fishing_trip_id', type: 'uuid' })
  fishingTripId!: string;

  @Column({ name: 'fishing_gear_id', type: 'uuid', nullable: true })
  fishingGearId!: string | null;

  @Column({ name: 'gear_type', type: 'varchar', length: 100, nullable: true })
  gearType!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  quantity!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  // ── Relationships ───────────────────────────────────────────────
  @ManyToOne(() => FishingTrip, (trip) => trip.gears, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'fishing_trip_id' })
  fishingTrip?: FishingTrip;

  @ManyToOne(() => FishingGear, (gear) => gear.tripGears, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'fishing_gear_id' })
  fishingGear?: FishingGear;
}
