/**
 * FISHING OPERATION PROFILE — Business Identifier for Fisherman/Crew.
 *
 * Purpose:
 *  - Provides a human-readable business identifier (fisherman_code) for searching
 *  - Separates business identity from identity service (logboook-identity-api)
 *  - Does NOT store sensitive personal data (CCCD, DOB, address)
 *
 * Design Rules:
 *  - fisherman_code is auto-generated via PostgreSQL sequence (FSH-000001)
 *  - user_id is a logical reference to logboook-identity-api (no FK)
 *  - One profile per user (UNIQUE user_id)
 *  - Code is never reused, never editable by client
 *  - Only created when user actually participates in fishing operations
 */
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { EntityName } from '../constants/enums/entity-name.enum';

export enum FishingOperationProfileStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Entity(EntityName.FISHING_OPERATION_PROFILES)
@Index(['fishermanCode'])
@Index(['userId'])
@Index(['status'])
export class FishingOperationProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Logical reference to logboook-identity-api account.
   * No FK constraint — services are decoupled.
   */
  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId!: string;

  /**
   * Auto-generated business identifier.
   * Format: FSH-000001
   * Generated via PostgreSQL sequence — safe for concurrent requests.
   * Never exposed to client for input — backend-only.
   */
  @Column({
    name: 'fisherman_code',
    type: 'varchar',
    length: 30,
    unique: true,
  })
  fishermanCode!: string;

  /**
   * Profile status for soft disable.
   * When INACTIVE, profile cannot be used for new assignments.
   */
  @Column({
    type: 'varchar',
    length: 30,
    default: FishingOperationProfileStatus.ACTIVE,
  })
  status!: FishingOperationProfileStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
