import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { LandingRecord } from '../landing-record/landing-record.entity';

import { EntityName } from '../constants/enums/entity-name.enum';

@Entity(EntityName.LANDING_CATCHES)
@Index(['landingRecordId'])
export class LandingCatch {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'landing_record_id', type: 'uuid' })
  landingRecordId!: string;

  @Column({
    name: 'species_code',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  speciesCode!: string | null;

  @Column({
    name: 'species_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  speciesName!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 3, nullable: true })
  quantity!: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  unit!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  // ── Relationships ───────────────────────────────────────────────
  @ManyToOne(() => LandingRecord, (landing) => landing.catches, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'landing_record_id' })
  landingRecord?: LandingRecord;
}
