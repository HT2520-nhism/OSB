/**
 * PHASE 6 — Sync handler errors: classification + non-leakage.
 */

import { toSyncBusinessError, SyncBusinessError } from './sync-handler.errors';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { SyncErrorCode } from '../sync.enum';

describe('SyncHandlerErrors', () => {
  it('classifies BadRequestException as VALIDATION_ERROR', () => {
    const e = toSyncBusinessError(new BadRequestException('bad'));
    expect(e).toBeInstanceOf(SyncBusinessError);
    expect(e.code).toBe(SyncErrorCode.VALIDATION_ERROR);
    expect(e.message).toContain('bad');
  });

  it('classifies NotFoundException as NOT_FOUND', () => {
    const e = toSyncBusinessError(new NotFoundException('nope'));
    expect(e.code).toBe(SyncErrorCode.NOT_FOUND);
  });

  it('classifies ConflictException as VERSION_CONFLICT', () => {
    const e = toSyncBusinessError(new ConflictException('stale'));
    expect(e.code).toBe(SyncErrorCode.VERSION_CONFLICT);
  });

  it('classifies ForbiddenException as AUTHORIZATION_ERROR', () => {
    const e = toSyncBusinessError(new ForbiddenException('forbidden'));
    expect(e.code).toBe(SyncErrorCode.AUTHORIZATION_ERROR);
  });

  it('classifies generic Error as BUSINESS_RULE_VIOLATION (no DB code mapping)', () => {
    const raw = new Error('something failed');
    const e = toSyncBusinessError(raw);
    expect(e.code).toBe(SyncErrorCode.BUSINESS_RULE_VIOLATION);
  });

  it('does not remap SyncBusinessError twice', () => {
    const original = new SyncBusinessError(
      SyncErrorCode.INVALID_STATE_TRANSITION,
      'cannot transition',
    );
    const wrapped = toSyncBusinessError(original);
    expect(wrapped).toBe(original);
  });
});
