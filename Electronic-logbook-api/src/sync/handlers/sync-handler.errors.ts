/**
 * PHASE 6 — Sync Handler Errors.
 *
 * Domain errors raised by handlers. The SyncService maps these to
 * per-operation results without crashing the batch.
 */

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { SyncErrorCode } from '../sync.enum';

export class SyncBusinessError extends Error {
  constructor(public readonly code: SyncErrorCode, message: string) {
    super(message);
    this.name = 'SyncBusinessError';
  }
}

export function toSyncBusinessError(err: unknown): SyncBusinessError {
  if (err instanceof SyncBusinessError) return err;
  if (err instanceof BadRequestException) {
    return new SyncBusinessError(
      SyncErrorCode.VALIDATION_ERROR,
      extractMessage(err),
    );
  }
  if (err instanceof NotFoundException) {
    return new SyncBusinessError(SyncErrorCode.NOT_FOUND, extractMessage(err));
  }
  if (err instanceof ConflictException) {
    return new SyncBusinessError(
      SyncErrorCode.VERSION_CONFLICT,
      extractMessage(err),
    );
  }
  if (err instanceof ForbiddenException) {
    return new SyncBusinessError(
      SyncErrorCode.AUTHORIZATION_ERROR,
      extractMessage(err),
    );
  }
  return new SyncBusinessError(
    SyncErrorCode.BUSINESS_RULE_VIOLATION,
    extractMessage(err),
  );
}

function extractMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Unknown error';
}
