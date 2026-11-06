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

import { Vessel } from '../vessel/vessel.entity';
import { FishingTripGear } from '../fishing-trip-gear/fishing-trip-gear.entity';

import { EntityName } from '../constants/enums/entity-name.enum';

@Entity(EntityName.FISHING_GEARS)
@Index(['vesselId'])
export class FishingGear {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'vessel_id', type: 'uuid', nullable: true })
  vesselId!: string | null;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'gear_type', type: 'varchar', length: 100, nullable: true })
  gearType!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  status!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  // ── Relationships ───────────────────────────────────────────────
  @ManyToOne(() => Vessel, (vessel) => vessel.gears, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'vessel_id' })
  vessel?: Vessel;

  @OneToMany(() => FishingTripGear, (tripGear) => tripGear.fishingGear)
  tripGears?: FishingTripGear[];
}
