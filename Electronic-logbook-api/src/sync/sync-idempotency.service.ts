/**
 * PHASE 6 — Sync Idempotency Service.
 *
 * Persistent idempotency based on the UNIQUE(operationId) constraint
 * on sync_operations. The service:
 *
 *  - Looks up a previously recorded operation by operationId.
 *  - Returns the prior recorded result if any.
 *  - Persists a new operation row (UNIQUE-constrained) atomically.
 *  - Provides status updates (PROCESSED / FAILED / CONFLICT).
 *
 * Concurrency safety:
 *  - The INSERT itself is the idempotency gate.
 *  - If two requests arrive simultaneously with the same operationId,
 *    the second insert will fail with a unique violation. The caller
 *    must treat that as a duplicate (read the existing row instead).
 */

import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import { SyncOperation } from '../sync-operation/sync-operation.entity';

import { SyncOperationStatus, SyncOperationType } from './sync.enum';

export interface RecordOperationInput {
  operationId: string;
  deviceId: string;
  userId: string;
  entityType: string;
  entityId: string;
  operationType: SyncOperationType;
  payload: Record<string, unknown> | null;
  clientVersion: number;
}

export interface PersistedOperation extends SyncOperation {}

@Injectable()
export class SyncIdempotencyService {
  private readonly logger = new Logger('SyncIdempotencyService');

  constructor(
    @InjectRepository(SyncOperation)
    private readonly repository: Repository<SyncOperation>,
  ) {}

  /**
   * Look up a previously persisted operation.
   * Returns null if no record exists.
   */
  async findByOperationId(operationId: string): Promise<SyncOperation | null> {
    return this.repository.findOne({ where: { operationId } });
  }

  /**
   * Record a new operation row.
   *
   * Returns either the newly-created row, or the existing row when
   * a concurrent insert won the unique-constraint race. The caller is
   * expected to inspect the returned row and act accordingly (replay
   * the previous result rather than re-execute).
   */
  async recordNew(
    input: RecordOperationInput,
  ): Promise<{ operation: SyncOperation; isNew: boolean }> {
    const existing = await this.findByOperationId(input.operationId);
    if (existing) {
      return { operation: existing, isNew: false };
    }

    try {
      const entity = this.repository.create({
        operationId: input.operationId,
        deviceId: input.deviceId,
        userId: input.userId,
        entityType: input.entityType,
        entityId: input.entityId,
        operationType: input.operationType,
        payload: input.payload,
        clientVersion: input.clientVersion,
        status: SyncOperationStatus.RETRYABLE, // tentative — gets updated
        errorCode: null,
        errorMessage: null,
        processedAt: null,
      });
      const saved = await this.repository.save(entity);
      return { operation: saved, isNew: true };
    } catch (err) {
      if (
        err instanceof QueryFailedError &&
        (err as unknown as { code?: string }).code === '23505'
      ) {
        // Concurrent insert — fetch the row that won.
        const winner = await this.findByOperationId(input.operationId);
        if (!winner) {
          throw new ConflictException(
            'Concurrent operation insert; row missing after race',
          );
        }
        return { operation: winner, isNew: false };
      }
      throw err;
    }
  }

  /**
   * Mark the operation with its final status and result summary.
   */
  async markCompleted(
    operation: SyncOperation,
    summary?: Record<string, unknown>,
  ): Promise<SyncOperation> {
    operation.status = SyncOperationStatus.COMPLETED;
    operation.errorCode = null;
    operation.errorMessage = null;
    operation.processedAt = new Date();
    if (summary) {
      operation.payload = { ...(operation.payload ?? {}), __result: summary };
    }
    return this.repository.save(operation);
  }

  async markFailed(
    operation: SyncOperation,
    errorCode: string,
    errorMessage: string,
    status: SyncOperationStatus = SyncOperationStatus.FAILED,
  ): Promise<SyncOperation> {
    operation.status = status;
    operation.errorCode = errorCode;
    operation.errorMessage = errorMessage;
    operation.processedAt = new Date();
    return this.repository.save(operation);
  }

  async markConflict(
    operation: SyncOperation,
    errorCode: string,
    errorMessage: string,
  ): Promise<SyncOperation> {
    return this.markFailed(
      operation,
      errorCode,
      errorMessage,
      SyncOperationStatus.CONFLICT,
    );
  }
}
