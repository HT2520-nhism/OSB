/**
 * PHASE 6 — DI token for the collection of sync entity handlers.
 *
 * Exported from a dedicated file so both consumers (SyncPushService) and
 * providers (SyncModule) can import it without creating a circular
 * dependency between service and module.
 */

export const SYNC_ENTITY_HANDLERS = Symbol('SYNC_ENTITY_HANDLERS');
