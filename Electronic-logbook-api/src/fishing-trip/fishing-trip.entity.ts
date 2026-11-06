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
import { FishingTripCrew } from '../fishing-trip-crew/fishing-trip-crew.entity';
import { FishingTripGear } from '../fishing-trip-gear/fishing-trip-gear.entity';
import { FishingOperation } from '../fishing-operation/fishing-operation.entity';
import { LandingRecord } from '../landing-record/landing-record.entity';
import { PortCall } from '../port-call/port-call.entity';
import { FuelRecord } from '../fuel-record/fuel-record.entity';
import { Incident } from '../incident/incident.entity';
import { FormSubmission } from '../form-submission/form-submission.entity';
import { Attachment } from '../attachment/attachment.entity';

import { EntityName } from '../constants/enums/entity-name.enum';

@Entity(EntityName.FISHING_TRIPS)
@Index(['vesselId'])
export class FishingTrip {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'vessel_id', type: 'uuid' })
  vesselId!: string;

  /** Logical reference only — no FK to identity-db. */
  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @Column({ name: 'trip_number', type: 'varchar', length: 100, nullable: true })
  tripNumber!: string | null;

  @Column({
    name: 'departure_port_code',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  departurePortCode!: string | null;

  @Column({
    name: 'arrival_port_code',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  arrivalPortCode!: string | null;

  @Column({ name: 'departure_at', type: 'timestamptz', nullable: true })
  departureAt!: Date | null;

  @Column({ name: 'arrival_at', type: 'timestamptz', nullable: true })
  arrivalAt!: Date | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  status!: string | null;

  @Column({
    name: 'submission_status',
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  submissionStatus!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  // ── Relationships ───────────────────────────────────────────────
  @ManyToOne(() => Vessel, (vessel) => vessel.fishingTrips, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'vessel_id' })
  vessel?: Vessel;

  @OneToMany(() => FishingTripCrew, (crew) => crew.fishingTrip)
  crewMembers?: FishingTripCrew[];

  @OneToMany(() => FishingTripGear, (gear) => gear.fishingTrip)
  gears?: FishingTripGear[];

  @OneToMany(() => FishingOperation, (op) => op.fishingTrip)
  operations?: FishingOperation[];

  @OneToMany(() => LandingRecord, (landing) => landing.fishingTrip)
  landings?: LandingRecord[];

  @OneToMany(() => PortCall, (portCall) => portCall.fishingTrip)
  portCalls?: PortCall[];

  @OneToMany(() => FuelRecord, (fuel) => fuel.fishingTrip)
  fuelRecords?: FuelRecord[];

  @OneToMany(() => Incident, (incident) => incident.fishingTrip)
  incidents?: Incident[];

  @OneToMany(() => FormSubmission, (submission) => submission.fishingTrip)
  formSubmissions?: FormSubmission[];

  @OneToMany(() => Attachment, (attachment) => attachment.fishingTrip)
  attachments?: Attachment[];
}
