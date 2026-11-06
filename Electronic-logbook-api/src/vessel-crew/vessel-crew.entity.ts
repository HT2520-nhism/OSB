import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Vessel } from '../vessel/vessel.entity';

import { EntityName } from '../constants/enums/entity-name.enum';

@Entity(EntityName.VESSEL_CREW)
@Index(['vesselId'])
export class VesselCrew {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'vessel_id', type: 'uuid' })
  vesselId!: string;

  /** Logical reference only — no FK to identity-db. */
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'crew_role', type: 'varchar', length: 50, nullable: true })
  crewRole!: string | null;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt!: Date | null;

  @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
  endedAt!: Date | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  // ── Relationships ───────────────────────────────────────────────
  @ManyToOne(() => Vessel, (vessel) => vessel.crewMembers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'vessel_id' })
  vessel?: Vessel;
}
