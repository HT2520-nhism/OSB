/**
 * PHASE 6 — Sync Push Service.
 *
 * Processes a batch of push operations:
 *  - validates device
 *  - checks idempotency (operationId)
 *  - dispatches to the entity handler
 *  - records conflicts where applicable
 *  - returns one result per input operation
 *
 * Each operation is processed in its own transaction so a single
 * failure does NOT roll back unrelated operations.
 */

import { Injectable, Logger, Inject } from '@nestjs/common';

import { SyncDeviceService } from './sync-device.service';
import { SyncIdempotencyService } from './sync-idempotency.service';
import { SyncConflictService } from './sync-conflict.service';
import { SYNC_ENTITY_HANDLERS } from './sync-handler.tokens';

import {
  SyncEntityType,
  SyncErrorCode,
  SyncOperationStatus,
  SyncOperationType,
} from './sync.enum';

import {
  SyncEntityHandler,
  SyncHandlerContext,
  SyncOperationEnvelope,
} from './handlers/sync-handler.interface';
import {
  SyncBusinessError,
  toSyncBusinessError,
} from './handlers/sync-handler.errors';

import { SyncPushDto } from './dto/sync.dto';
import { AuthUser } from '../auth/current-user.decorator';

export interface SyncPushResultItem {
  operationId: string;
  entityType: SyncEntityType;
  entityId: string;
  status: SyncOperationStatus;
  errorCode: SyncErrorCode | null;
  errorMessage: string | null;
  retryable: boolean;
  serverVersion?: number;
  serverData?: Record<string, unknown>;
}

export interface SyncPushResponse {
  deviceId: string;
  results: SyncPushResultItem[];
}

const MAX_OPS_PER_BATCH = 200;

@Injectable()
export class SyncPushService {
  private readonly logger = new Logger('SyncPushService');

  constructor(
    private readonly deviceService: SyncDeviceService,
    private readonly idempotency: SyncIdempotencyService,
    private readonly conflictService: SyncConflictService,
    @Inject(SYNC_ENTITY_HANDLERS)
    private readonly handlers: SyncEntityHandler[],
  ) {}

  async push(input: SyncPushDto, user: AuthUser): Promise<SyncPushResponse> {
    if (input.operations.length > MAX_OPS_PER_BATCH) {
      throw new Error(`Batch too large (max ${MAX_OPS_PER_BATCH} operations)`);
    }
    // 1) Validate device and ownership.
    const device = await this.deviceService.assertAuthorized(
      input.deviceId,
      user,
    );

    // 2) Process operations in order, in their own transactions.
    const results: SyncPushResultItem[] = [];
    for (const raw of input.operations) {
      const op: SyncOperationEnvelope = {
        operationId: raw.operationId,
        entityType: raw.entityType,
        entityId: raw.entityId,
        operationType: raw.operationType,
        clientVersion: raw.clientVersion,
        payload: raw.payload ?? null,
      };
      const result = await this.processOne(op, user, device.deviceId);
      results.push(result);
    }
    await this.deviceService.recordSyncSuccess(device.deviceId);
    return { deviceId: device.deviceId, results };
  }

  private async processOne(
    op: SyncOperationEnvelope,
    user: AuthUser,
    deviceId: string,
  ): Promise<SyncPushResultItem> {
    this.logger.log({
      event: 'sync.op.received',
      operationId: op.operationId,
      entityType: op.entityType,
      entityId: op.entityId,
      operationType: op.operationType,
    });

    // Idempotency: try to record (or look up) the operation row.
    const { operation, isNew } = await this.idempotency.recordNew({
      operationId: op.operationId,
      deviceId,
      userId: user.accountId,
      entityType: op.entityType,
      entityId: op.entityId,
      operationType: op.operationType,
      payload: op.payload,
      clientVersion: op.clientVersion,
    });

    if (!isNew) {
      // Replay: return the previously recorded result.
      return {
        operationId: op.operationId,
        entityType: op.entityType,
        entityId: op.entityId,
        status:
          (operation.status as SyncOperationStatus) ??
          SyncOperationStatus.COMPLETED,
        errorCode: (operation.errorCode as SyncErrorCode | null) ?? null,
        errorMessage: operation.errorMessage ?? null,
        retryable: false,
        serverVersion:
          (operation.payload as { __result?: { serverVersion?: number } })
            ?.__result?.serverVersion ?? 1,
      };
    }

    // Dispatch to handler.
    const handler = this.handlers.find((h) => h.supports(op.entityType));
    if (!handler) {
      const err = new SyncBusinessError(
        SyncErrorCode.UNSUPPORTED_ENTITY,
        `Unsupported entity type ${op.entityType}`,
      );
      await this.idempotency.markFailed(
        operation,
        err.code,
        err.message,
        SyncOperationStatus.FAILED,
      );
      return this.failureItem(op, err.code, err.message, false);
    }

    // Load server snapshot for conflict detection.
    const ctx: SyncHandlerContext = {
      user,
      before: await handler
        .loadServerSnapshot(op.entityId, { user })
        .catch(() => null),
    };

    let result;
    try {
      result = await this.dispatch(handler, op, ctx);
    } catch (e) {
      const err = e instanceof SyncBusinessError ? e : toSyncBusinessError(e);
      const isConflict = err.code === SyncErrorCode.VERSION_CONFLICT;
      const status = isConflict
        ? SyncOperationStatus.CONFLICT
        : err.code === SyncErrorCode.AUTHORIZATION_ERROR ||
          err.code === SyncErrorCode.DEVICE_NOT_AUTHORIZED
        ? SyncOperationStatus.FAILED
        : err.code === SyncErrorCode.TEMPORARY_ERROR
        ? SyncOperationStatus.RETRYABLE
        : SyncOperationStatus.FAILED;

      if (isConflict || err.code === SyncErrorCode.BUSINESS_RULE_VIOLATION) {
        await this.conflictService.record({
          syncOperationId: operation.id,
          entityType: op.entityType,
          entityId: op.entityId,
          clientData: this.safeClientData(op.payload),
          serverData: ctx.before ?? null,
        });
      }
      await this.idempotency.markFailed(
        operation,
        err.code,
        err.message,
        status,
      );
      return this.failureItem(
        op,
        err.code,
        err.message,
        status === SyncOperationStatus.RETRYABLE,
      );
    }

    await this.idempotency.markCompleted(operation, {
      serverVersion: result.serverVersion,
    });
    return {
      operationId: op.operationId,
      entityType: op.entityType,
      entityId: result.entityId,
      status: SyncOperationStatus.COMPLETED,
      errorCode: null,
      errorMessage: null,
      retryable: false,
      serverVersion: result.serverVersion,
      serverData: result.data,
    };
  }

  private async dispatch(
    handler: SyncEntityHandler,
    op: SyncOperationEnvelope,
    ctx: SyncHandlerContext,
  ) {
    if (op.entityType === SyncEntityType.FORM_SUBMISSION_DATA) {
      // FORM_SUBMISSION_DATA payloads must be routed through the
      // form-submission versioned-update path. We use the dedicated
      // form handler with an UPDATE shape.
      return handler.applyUpdate(op, ctx);
    }
    switch (op.operationType) {
      case SyncOperationType.CREATE:
        return handler.applyCreate(op, ctx);
      case SyncOperationType.UPDATE:
        return handler.applyUpdate(op, ctx);
      case SyncOperationType.DELETE:
        return handler.applyDelete(op, ctx);
      default:
        throw new SyncBusinessError(
          SyncErrorCode.VALIDATION_ERROR,
          `Unknown operationType ${String(op.operationType)}`,
        );
    }
  }

  private failureItem(
    op: SyncOperationEnvelope,
    code: SyncErrorCode,
    message: string,
    retryable: boolean,
  ): SyncPushResultItem {
    return {
      operationId: op.operationId,
      entityType: op.entityType,
      entityId: op.entityId,
      status: retryable
        ? SyncOperationStatus.RETRYABLE
        : code === SyncErrorCode.VERSION_CONFLICT
        ? SyncOperationStatus.CONFLICT
        : SyncOperationStatus.FAILED,
      errorCode: code,
      errorMessage: message,
      retryable,
    };
  }

  private safeClientData(
    payload: Record<string, unknown> | null,
  ): Record<string, unknown> | null {
    if (!payload) return null;
    // Strip anything that looks like a password/token.
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(payload)) {
      if (/(password|token|secret|apiKey)/i.test(k)) continue;
      out[k] = v;
    }
    return out;
  }
}
