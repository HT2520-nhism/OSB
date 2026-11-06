import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import { AccountEntity } from '../account/account.entity';
import { EntityName } from '../constants/enums/entity-name.enum';

@Entity(EntityName.SESSION)
@Index(['accountId'])
@Index(['expiresAt'])
@Index(['revokedAt'])
@Index(['deviceId'])
export class SessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'account_id',
    type: 'uuid',
  })
  accountId!: string;

  @Column({
    name: 'refresh_token_hash',
    type: 'varchar',
    length: 255,
  })
  refreshTokenHash!: string;

  @Column({
    name: 'device_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  deviceId?: string;

  @Column({
    name: 'device_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  deviceName?: string;

  @Column({
    name: 'ip_address',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  ipAddress?: string;

  @Column({
    name: 'user_agent',
    type: 'text',
    nullable: true,
  })
  userAgent?: string;

  @Column({
    name: 'expires_at',
    type: 'timestamptz',
  })
  expiresAt!: Date;

  @Column({
    name: 'last_used_at',
    type: 'timestamptz',
    nullable: true,
  })
  lastUsedAt?: Date;

  @Column({
    name: 'revoked_at',
    type: 'timestamptz',
    nullable: true,
  })
  revokedAt?: Date;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt!: Date;

  @ManyToOne(() => AccountEntity, (account) => account.sessions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'account_id' })
  account!: AccountEntity;
}
