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

@Entity(EntityName.FISHING_TRIP_CREW)
@Index(['fishingTripId'])
export class FishingTripCrew {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'fishing_trip_id', type: 'uuid' })
  fishingTripId!: string;

  /** Logical reference only — no FK to identity-db. */
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'crew_role', type: 'varchar', length: 50, nullable: true })
  crewRole!: string | null;

  @Column({ name: 'joined_at', type: 'timestamptz', nullable: true })
  joinedAt!: Date | null;

  @Column({ name: 'left_at', type: 'timestamptz', nullable: true })
  leftAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  // ── Relationships ───────────────────────────────────────────────
  @ManyToOne(() => FishingTrip, (trip) => trip.crewMembers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'fishing_trip_id' })
  fishingTrip?: FishingTrip;
}
