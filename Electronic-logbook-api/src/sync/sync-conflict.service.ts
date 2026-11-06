/**
 * PHASE 6 — Sync Conflict Service.
 *
 * Persists conflict records into sync_conflicts. Conflicts are
 * IMMUTABLE historical records — they are NEVER deleted and NEVER
 * mutated (other than setting resolution/resolvedBy/resolvedAt).
 *
 * The table is the audit trail for client/server disputes.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SyncConflict } from '../sync-conflict/sync-conflict.entity';

import { SyncConflictResolution } from './sync.enum';

import { Logger } from '../services/logger.service';

@Injectable()
export class SyncConflictService {
  private readonly logger = new Logger('SyncConflictService');

  constructor(
    @InjectRepository(SyncConflict)
    private readonly repository: Repository<SyncConflict>,
  ) {}

  async record(input: {
    syncOperationId: string;
    entityType: string;
    entityId: string;
    clientData: Record<string, unknown> | null;
    serverData: Record<string, unknown> | null;
    resolution?: SyncConflictResolution;
    resolvedBy?: string | null;
  }): Promise<SyncConflict> {
    this.logger.log({
      event: 'sync.conflict.record',
      entityType: input.entityType,
      entityId: input.entityId,
      syncOperationId: input.syncOperationId,
    });
    const entity = this.repository.create({
      syncOperationId: input.syncOperationId,
      entityType: input.entityType,
      entityId: input.entityId,
      clientData: input.clientData,
      serverData: input.serverData,
      resolution: input.resolution ?? SyncConflictResolution.SERVER_WINS,
      resolvedBy: input.resolvedBy ?? null,
      resolvedAt: input.resolvedBy ? new Date() : null,
    });
    return this.repository.save(entity);
  }

  async findAll(): Promise<SyncConflict[]> {
    return this.repository.find();
  }

  async findOne(id: string): Promise<SyncConflict> {
    const e = await this.repository.findOne({ where: { id } });
    if (!e) {
      throw new Error(`SyncConflict ${id} not found`);
    }
    return e;
  }

  async findByOperationId(syncOperationId: string): Promise<SyncConflict[]> {
    return this.repository.find({ where: { syncOperationId } });
  }

  /**
   * Total unresolved conflicts belonging to the user's devices. Used by
   * /sync/status to surface the count to mobile banners.
   */
  async countForUser(accountId: string): Promise<number> {
    if (!accountId) return 0;
    return this.repository
      .createQueryBuilder('c')
      .leftJoin('c.syncOperation', 'op')
      .where('op.user_id = :accountId', { accountId })
      .andWhere('c.resolved_at IS NULL')
      .getCount();
  }
}
