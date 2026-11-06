/**
 * PHASE 6 — Generic CRUD-style Sync Handler.
 *
 * Used by entities whose Phase 5 service exposes a `create`/`update`/
 * `remove` shape and where the entity does NOT have a state machine
 * of its own (i.e. state mutation is restricted to fishing trips and
 * form submissions which get dedicated handlers).
 *
 * The handler routes through the existing service so business rules
 * (e.g. vessel-existence check for FishingTrip, vessel status
 * rejection, etc.) are preserved.
 *
 * Identity fields are forced from the auth context; the client payload
 * is allowed to provide only data fields.
 */

import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import {
  SyncEntityHandler,
  SyncHandlerContext,
  SyncHandlerResult,
  SyncOperationEnvelope,
} from './sync-handler.interface';
import { SyncEntityType, SyncOperationType } from '../sync.enum';

import { Vessel } from '../../vessel/vessel.entity';
import { FishingTripCrew } from '../../fishing-trip-crew/fishing-trip-crew.entity';
import { FishingTripGear } from '../../fishing-trip-gear/fishing-trip-gear.entity';
import { FishingOperation } from '../../fishing-operation/fishing-operation.entity';
import { CatchRecord } from '../../catch-record/catch-record.entity';
import { PortCall } from '../../port-call/port-call.entity';
import { FuelRecord } from '../../fuel-record/fuel-record.entity';
import { Incident } from '../../incident/incident.entity';

export interface GenericHandlerOpts {
  entityType: SyncEntityType;
  entityName: string;
  repository: Repository<{ id: string; [k: string]: unknown }>;
}

@Injectable()
export class GenericCrudSyncHandler implements SyncEntityHandler {
  constructor(private readonly opts: GenericHandlerOpts) {}

  supports(entityType: SyncEntityType): boolean {
    return entityType === this.opts.entityType;
  }

  async applyCreate(
    op: SyncOperationEnvelope,
    _ctx: SyncHandlerContext,
  ): Promise<SyncHandlerResult> {
    if (!op.payload) {
      throw new Error('CREATE operation requires a payload');
    }
    // Strip server-controlled identity fields from the client payload.
    const safe = this.stripServerControlled(op.payload);
    safe.id = op.entityId;
    const entity = this.opts.repository.create(safe);
    const saved = (await this.opts.repository.save(entity)) as { id: string };
    return {
      entityId: saved.id,
      serverVersion: 1,
    };
  }

  async applyUpdate(
    op: SyncOperationEnvelope,
    _ctx: SyncHandlerContext,
  ): Promise<SyncHandlerResult> {
    if (!op.payload) {
      throw new Error('UPDATE operation requires a payload');
    }
    const before = await this.loadServerSnapshot(op.entityId, _ctx);
    if (!before) {
      throw new Error(`Entity ${op.entityId} not found`);
    }
    const safe = this.stripServerControlled(op.payload);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (this.opts.repository as any).update(op.entityId, safe);
    const after = await this.loadServerSnapshot(op.entityId, _ctx);
    return {
      entityId: op.entityId,
      serverVersion: this.computeVersion(after),
      data: this.projectToClient(after),
    };
  }

  async applyDelete(
    op: SyncOperationEnvelope,
    _ctx: SyncHandlerContext,
  ): Promise<SyncHandlerResult> {
    await this.opts.repository.delete(op.entityId);
    return {
      entityId: op.entityId,
      serverVersion: 0,
    };
  }

  async loadServerSnapshot(
    entityId: string,
    _ctx: SyncHandlerContext,
  ): Promise<Record<string, unknown> | null> {
    const e = (await this.opts.repository.findOne({
      where: { id: entityId },
    })) as Record<string, unknown> | null;
    return e ? this.projectToClient(e) : null;
  }

  private stripServerControlled(
    payload: Record<string, unknown>,
  ): Record<string, unknown> {
    const forbidden = new Set([
      'id',
      'createdAt',
      'updatedAt',
      'createdBy',
      'submittedBy',
      'reportedBy',
      'confirmedBy',
      'changedBy',
      'actorId',
      'uploadedBy',
      'resolvedBy',
      'ownerUserId',
      'status',
    ]);
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(payload)) {
      if (!forbidden.has(k)) out[k] = v;
    }
    return out;
  }

  private projectToClient(
    entity: Record<string, unknown> | null,
  ): Record<string, unknown> {
    if (!entity) return {};
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(entity)) {
      if (
        k === 'vessel' ||
        k === 'fishingTrip' ||
        k === 'fishingOperation' ||
        k === 'landingRecord' ||
        k === 'formSubmission' ||
        k === 'device' ||
        k === 'syncOperations' ||
        k === 'conflicts' ||
        k === 'crewMembers' ||
        k === 'gears' ||
        k === 'operations' ||
        k === 'landings' ||
        k === 'portCalls' ||
        k === 'fuelRecords' ||
        k === 'incidents' ||
        k === 'formSubmissions' ||
        k === 'attachments' ||
        k === 'submissions'
      ) {
        continue;
      }
      out[k] = v;
    }
    return out;
  }

  private computeVersion(snapshot: Record<string, unknown> | null): number {
    if (!snapshot) return 0;
    const v = snapshot['version'];
    if (typeof v === 'number') return v;
    return 1;
  }
}

/**
 * Factory used by the SyncModule to wire a generic handler for entities
 * that don't have their own dedicated handler.
 */
export function makeGenericHandler(
  entityType: SyncEntityType,
  entityName: string,
  repository: Repository<{ id: string; [k: string]: unknown }>,
): GenericCrudSyncHandler {
  return new GenericCrudSyncHandler({ entityType, entityName, repository });
}

// Type-only exports kept for compile-time checks if needed.
export type GenericEntityTables =
  | Vessel
  | FishingTripCrew
  | FishingTripGear
  | PortCall
  | FuelRecord
  | Incident;

export type GenericEntityTablesWithOp = FishingOperation | CatchRecord;
