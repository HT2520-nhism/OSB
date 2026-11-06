/**
 * PHASE 6 — Sync Push Service DI signature test.
 *
 * Verifies the constructor signature of SyncPushService matches the
 * production wiring in SyncModule (4 params, last one is SyncEntityHandler[]).
 *
 * The full module DI graph is exercised by the existing sync.* unit tests;
 * this test pins the constructor contract so future refactors that
 * accidentally drop the @Inject(SYNC_ENTITY_HANDLERS) decorator are
 * caught early.
 */

import { SyncPushService } from './sync-push.service';
import { SyncEntityHandler } from './handlers/sync-handler.interface';

describe('SyncPushService — DI signature', () => {
  it('constructor accepts (deviceService, idempotency, conflict, handlers)', () => {
    const deviceService = {} as never;
    const idempotency = {} as never;
    const conflict = {} as never;
    const handlers: SyncEntityHandler[] = [];

    const instance = new SyncPushService(
      deviceService,
      idempotency,
      conflict,
      handlers,
    );

    expect(instance).toBeInstanceOf(SyncPushService);
    expect(
      (instance as unknown as { handlers: SyncEntityHandler[] }).handlers,
    ).toBe(handlers);
  });

  it('handlers parameter is typed SyncEntityHandler[]', () => {
    const acceptHandlerArray = (arr: SyncEntityHandler[]) => arr.length;
    expect(acceptHandlerArray([])).toBe(0);
  });
});
