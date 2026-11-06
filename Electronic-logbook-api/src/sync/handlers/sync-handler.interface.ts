/**
 * PHASE 6 — Sync Entity Handler Contract.
 *
 * Each handler is responsible for mapping an offline-originated operation
 * (CREATE/UPDATE/DELETE) onto the corresponding Phase 5 domain service.
 *
 * Handlers MUST NOT bypass domain services. Handlers MUST NOT trust
 * client-provided userId/createdBy/submittedBy/etc. Identity always
 * comes from the auth context.
 */

import type { AuthUser } from '../../auth/current-user.decorator';
import { SyncEntityType, SyncOperationType } from '../sync.enum';

export interface SyncOperationEnvelope {
  operationId: string;
  entityType: SyncEntityType;
  entityId: string;
  operationType: SyncOperationType;
  clientVersion: number;
  payload: Record<string, unknown> | null;
}

export interface SyncHandlerResult {
  /** Authoritative entity id after the operation. May equal input.entityId. */
  entityId: string;
  /** Authoritative server version after the operation. */
  serverVersion: number;
  /** Optional safe subset of the new server state for the mobile client. */
  data?: Record<string, unknown>;
}

export interface SyncHandlerContext {
  user: AuthUser;
  /** Server snapshot before mutation — used for conflict detection. */
  before?: Record<string, unknown> | null;
}

export interface SyncEntityHandler {
  supports(entityType: SyncEntityType): boolean;

  applyCreate(
    op: SyncOperationEnvelope,
    ctx: SyncHandlerContext,
  ): Promise<SyncHandlerResult>;

  applyUpdate(
    op: SyncOperationEnvelope,
    ctx: SyncHandlerContext,
  ): Promise<SyncHandlerResult>;

  applyDelete(
    op: SyncOperationEnvelope,
    ctx: SyncHandlerContext,
  ): Promise<SyncHandlerResult>;

  /**
   * Read the current server snapshot for the entity (used for conflict
   * detection and as the `serverData` of a conflict record).
   */
  loadServerSnapshot(
    entityId: string,
    ctx: SyncHandlerContext,
  ): Promise<Record<string, unknown> | null>;
}

/**
 * Marker that lets a handler delegate to another handler if its own
 * entity is missing a service dependency. Today this is unused but
 * kept for forward-compatibility with cross-entity flows.
 */
export const SYNC_HANDLER = Symbol.for('SYNC_ENTITY_HANDLER');
