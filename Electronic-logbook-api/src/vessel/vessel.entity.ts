import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { FishingTrip } from '../fishing-trip/fishing-trip.entity';
import { FishingGear } from '../fishing-gear/fishing-gear.entity';
import { VesselOwner } from '../vessel-owner/vessel-owner.entity';
import { VesselCrew } from '../vessel-crew/vessel-crew.entity';
import { Incident } from '../incident/incident.entity';
import { FormSubmission } from '../form-submission/form-submission.entity';
import { Attachment } from '../attachment/attachment.entity';

import { EntityName } from '../constants/enums/entity-name.enum';

@Entity(EntityName.VESSELS)
export class Vessel {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ name: 'registration_number', type: 'varchar', length: 100 })
  registrationNumber!: string;

  @Column({ name: 'vessel_name', type: 'varchar', length: 255, nullable: true })
  vesselName!: string | null;

  @Column({ name: 'vessel_type', type: 'varchar', length: 50, nullable: true })
  vesselType!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  length!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  width!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  depth!: string | null;

  @Column({
    name: 'gross_tonnage',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  grossTonnage!: string | null;

  @Column({
    name: 'engine_power',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  enginePower!: string | null;

  @Column({
    name: 'province_code',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  provinceCode!: string | null;

  @Column({
    name: 'district_code',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  districtCode!: string | null;

  @Column({ name: 'ward_code', type: 'varchar', length: 50, nullable: true })
  wardCode!: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  status!: string | null;

  /** Owner ID - user who created this vessel (denormalized for fast filtering) */
  @Column({ name: 'owner_id', type: 'uuid', nullable: true })
  ownerId!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  // ── Relationships (1:N from Vessel) ────────────────────────────
  @OneToMany(() => VesselOwner, (owner) => owner.vessel)
  owners?: VesselOwner[];

  @OneToMany(() => VesselCrew, (crew) => crew.vessel)
  crewMembers?: VesselCrew[];

  @OneToMany(() => FishingTrip, (trip) => trip.vessel)
  fishingTrips?: FishingTrip[];

  @OneToMany(() => FishingGear, (gear) => gear.vessel)
  gears?: FishingGear[];

  @OneToMany(() => Incident, (incident) => incident.vessel)
  incidents?: Incident[];

  @OneToMany(() => FormSubmission, (submission) => submission.vessel)
  formSubmissions?: FormSubmission[];

  @OneToMany(() => Attachment, (attachment) => attachment.vessel)
  attachments?: Attachment[];
}
