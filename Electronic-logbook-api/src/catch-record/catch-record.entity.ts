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

import { FishingOperation } from '../fishing-operation/fishing-operation.entity';

import { EntityName } from '../constants/enums/entity-name.enum';

@Entity(EntityName.CATCH_RECORDS)
@Index(['fishingOperationId'])
export class CatchRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'fishing_operation_id', type: 'uuid' })
  fishingOperationId!: string;

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

  @Column({
    name: 'estimated_quantity',
    type: 'decimal',
    precision: 12,
    scale: 3,
    nullable: true,
  })
  estimatedQuantity!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  condition!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  // ── Relationships ───────────────────────────────────────────────
  @ManyToOne(() => FishingOperation, (op) => op.catchRecords, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'fishing_operation_id' })
  fishingOperation?: FishingOperation;
}
