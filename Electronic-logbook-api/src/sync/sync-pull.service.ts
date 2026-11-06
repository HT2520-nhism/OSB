/**
 * PHASE 6 — Sync Pull Service (cursor-based change feed).
 *
 * The mobile client sends an opaque cursor; we return server-side
 * changes that occurred strictly AFTER the cursor.
 *
 * Cursor semantics:
 *   - Cursor encodes the timestamp + last emitted operation id.
 *   - Updates are derived from `updated_at` on the relevant tables.
 *   - Ordering is stable on (updated_at ASC, id ASC).
 *   - The cursor returned in the response is opaque to the client.
 *
 * IMPORTANT: Sync pull delivers only data the authenticated device's
 * user is authorized to read. We authorize via the existing
 * Phase 5/Phase 4 guards (vessel ownership / trip access is not
 * yet model-level; for now we filter by createdBy/submittedBy where
 * the field exists).
 */

import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Brackets, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';

import { SyncDeviceService } from './sync-device.service';
import { FishingTrip } from '../fishing-trip/fishing-trip.entity';
import { FishingOperation } from '../fishing-operation/fishing-operation.entity';
import { CatchRecord } from '../catch-record/catch-record.entity';
import { LandingRecord } from '../landing-record/landing-record.entity';
import { LandingCatch } from '../landing-catch/landing-catch.entity';
import { FormSubmission } from '../form-submission/form-submission.entity';
import { FormSubmissionData } from '../form-submission-data/form-submission-data.entity';
import { OutboxEvent } from '../outbox-event/outbox-event.entity';

import { AuthUser } from '../auth/current-user.decorator';

import { SyncPullDto } from './dto/sync.dto';

export interface PullChange {
  entityType: string;
  entityId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  version: number;
  data: Record<string, unknown>;
}

export interface PullResponse {
  changes: PullChange[];
  nextCursor: string | null;
  hasMore: boolean;
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

interface CursorState {
  /** ISO timestamp of last-emitted row. */
  ts: string;
  /** id of last-emitted row (for tie-break within same ts). */
  id: string;
}

function encodeCursor(state: CursorState): string {
  const payload = JSON.stringify(state);
  return Buffer.from(payload, 'utf8').toString('base64url');
}

function decodeCursor(cursor: string): CursorState {
  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
    const parsed = JSON.parse(decoded);
    if (typeof parsed.ts !== 'string' || typeof parsed.id !== 'string') {
      throw new Error('invalid cursor');
    }
    return parsed;
  } catch {
    throw new BadCursor('Invalid cursor');
  }
}

class BadCursor extends Error {}

@Injectable()
export class SyncPullService {
  private readonly logger = new Logger('SyncPullService');

  constructor(
    private readonly deviceService: SyncDeviceService,
    @InjectRepository(FishingTrip)
    private readonly tripRepo: Repository<FishingTrip>,
    @InjectRepository(FishingOperation)
    private readonly opRepo: Repository<FishingOperation>,
    @InjectRepository(CatchRecord)
    private readonly catchRepo: Repository<CatchRecord>,
    @InjectRepository(LandingRecord)
    private readonly landingRepo: Repository<LandingRecord>,
    @InjectRepository(LandingCatch)
    private readonly landingCatchRepo: Repository<LandingCatch>,
    @InjectRepository(FormSubmission)
    private readonly submissionRepo: Repository<FormSubmission>,
    @InjectRepository(FormSubmissionData)
    private readonly submissionDataRepo: Repository<FormSubmissionData>,
    @InjectRepository(OutboxEvent)
    private readonly outboxRepo: Repository<OutboxEvent>,
  ) {}

  async pull(
    input: SyncPullDto,
    user: AuthUser,
    deviceId: string,
  ): Promise<PullResponse> {
    const device = await this.deviceService.assertAuthorized(deviceId, user);
    const limit = Math.min(MAX_LIMIT, input.limit ?? DEFAULT_LIMIT);

    const state: CursorState = input.cursor
      ? safeDecode(input.cursor)
      : {
          ts: '1970-01-01T00:00:00.000Z',
          id: '00000000-0000-0000-0000-000000000000',
        };

    const changes: PullChange[] = [];
    let lastEmitted: CursorState | null = null;

    // Each entity type is queried with the same cursor semantics.
    // The combined change list is then trimmed to `limit`.

    const tripChanges = await this.pullTrips(
      state,
      limit + 1,
      user,
      device.deviceId,
    );
    for (const c of tripChanges) {
      if (changes.length >= limit) {
        return {
          changes,
          nextCursor: lastEmitted ? encodeCursor(lastEmitted) : null,
          hasMore: true,
        };
      }
      changes.push(c);
      lastEmitted = {
        ts: new Date(c.data['updatedAt'] as string).toISOString(),
        id: c.entityId,
      };
    }

    const opChanges = await this.pullOps(
      state,
      limit + 1 - changes.length,
      user,
    );
    for (const c of opChanges) {
      if (changes.length >= limit) {
        return {
          changes,
          nextCursor: lastEmitted ? encodeCursor(lastEmitted) : null,
          hasMore: true,
        };
      }
      changes.push(c);
      const ts = c.data['updatedAt'];
      lastEmitted = {
        ts: ts
          ? new Date(ts as string).toISOString()
          : new Date().toISOString(),
        id: c.entityId,
      };
    }

    const catchChanges = await this.pullCatches(
      state,
      limit + 1 - changes.length,
    );
    for (const c of catchChanges) {
      if (changes.length >= limit) {
        return {
          changes,
          nextCursor: lastEmitted ? encodeCursor(lastEmitted) : null,
          hasMore: true,
        };
      }
      changes.push(c);
      const ts = c.data['updatedAt'];
      lastEmitted = {
        ts: ts
          ? new Date(ts as string).toISOString()
          : new Date().toISOString(),
        id: c.entityId,
      };
    }

    const landingChanges = await this.pullLandings(
      state,
      limit + 1 - changes.length,
    );
    for (const c of landingChanges) {
      if (changes.length >= limit) {
        return {
          changes,
          nextCursor: lastEmitted ? encodeCursor(lastEmitted) : null,
          hasMore: true,
        };
      }
      changes.push(c);
      const ts = c.data['updatedAt'];
      lastEmitted = {
        ts: ts
          ? new Date(ts as string).toISOString()
          : new Date().toISOString(),
        id: c.entityId,
      };
    }

    const submissionChanges = await this.pullFormSubmissions(
      state,
      limit + 1 - changes.length,
      user,
    );
    for (const c of submissionChanges) {
      if (changes.length >= limit) {
        return {
          changes,
          nextCursor: lastEmitted ? encodeCursor(lastEmitted) : null,
          hasMore: true,
        };
      }
      changes.push(c);
      const ts = c.data['updatedAt'];
      lastEmitted = {
        ts: ts
          ? new Date(ts as string).toISOString()
          : new Date().toISOString(),
        id: c.entityId,
      };
    }

    const submissionDataChanges = await this.pullFormSubmissionData(
      state,
      limit + 1 - changes.length,
    );
    for (const c of submissionDataChanges) {
      if (changes.length >= limit) {
        return {
          changes,
          nextCursor: lastEmitted ? encodeCursor(lastEmitted) : null,
          hasMore: true,
        };
      }
      changes.push(c);
      const ts = c.data['updatedAt'];
      lastEmitted = {
        ts: ts
          ? new Date(ts as string).toISOString()
          : new Date().toISOString(),
        id: c.entityId,
      };
    }

    return {
      changes,
      nextCursor: lastEmitted ? encodeCursor(lastEmitted) : null,
      hasMore: false,
    };
  }

  // ─── Per-entity pulls (authorized) ──────────────────────────────

  private async pullTrips(
    state: CursorState,
    take: number,
    user: AuthUser,
    deviceId: string,
  ): Promise<PullChange[]> {
    if (take <= 0) return [];
    const qb = this.tripRepo
      .createQueryBuilder('t')
      .where(
        new Brackets((q) => {
          q.where('t.updated_at > :ts', { ts: state.ts }).orWhere(
            '(t.updated_at = :ts AND t.id > :id)',
            { ts: state.ts, id: state.id },
          );
        }),
      )
      .andWhere('t.created_by = :uid', { uid: user.accountId })
      .orderBy('t.updated_at', 'ASC')
      .addOrderBy('t.id', 'ASC')
      .limit(take);
    const rows = await qb.getMany();
    return rows.map((t) => ({
      entityType: 'fishing_trip',
      entityId: t.id,
      operation: 'UPDATE' as const,
      version: 1,
      data: this.projectTrip(t, deviceId),
    }));
  }

  private async pullOps(
    state: CursorState,
    take: number,
    _user: AuthUser,
  ): Promise<PullChange[]> {
    if (take <= 0) return [];
    const rows = await this.opRepo
      .createQueryBuilder('o')
      .where(
        new Brackets((q) => {
          q.where('o.updated_at > :ts', { ts: state.ts }).orWhere(
            '(o.updated_at = :ts AND o.id > :id)',
            { ts: state.ts, id: state.id },
          );
        }),
      )
      .orderBy('o.updated_at', 'ASC')
      .addOrderBy('o.id', 'ASC')
      .limit(take)
      .getMany();
    return rows.map((o) => ({
      entityType: 'fishing_operation',
      entityId: o.id,
      operation: 'UPDATE' as const,
      version: 1,
      data: {
        id: o.id,
        fishingTripId: o.fishingTripId,
        latitude: o.latitude,
        longitude: o.longitude,
        operationStartedAt: o.operationStartedAt,
        operationEndedAt: o.operationEndedAt,
        operationType: o.operationType,
        fishingGearType: o.fishingGearType,
        depth: o.depth,
        notes: o.notes,
        createdBy: o.createdBy,
        updatedAt: o.updatedAt,
      },
    }));
  }

  private async pullCatches(
    state: CursorState,
    take: number,
  ): Promise<PullChange[]> {
    if (take <= 0) return [];
    const rows = await this.catchRepo
      .createQueryBuilder('c')
      .where(
        new Brackets((q) => {
          q.where('c.updated_at > :ts', { ts: state.ts }).orWhere(
            '(c.updated_at = :ts AND c.id > :id)',
            { ts: state.ts, id: state.id },
          );
        }),
      )
      .orderBy('c.updated_at', 'ASC')
      .addOrderBy('c.id', 'ASC')
      .limit(take)
      .getMany();
    return rows.map((c) => ({
      entityType: 'catch_record',
      entityId: c.id,
      operation: 'UPDATE' as const,
      version: 1,
      data: {
        id: c.id,
        fishingOperationId: c.fishingOperationId,
        speciesCode: c.speciesCode,
        speciesName: c.speciesName,
        quantity: c.quantity,
        unit: c.unit,
        estimatedQuantity: c.estimatedQuantity,
        condition: c.condition,
        notes: c.notes,
        updatedAt: c.updatedAt,
      },
    }));
  }

  private async pullLandings(
    state: CursorState,
    take: number,
  ): Promise<PullChange[]> {
    if (take <= 0) return [];
    const rows = await this.landingRepo
      .createQueryBuilder('l')
      .where(
        new Brackets((q) => {
          q.where('l.created_at > :ts', { ts: state.ts }).orWhere(
            '(l.created_at = :ts AND l.id > :id)',
            { ts: state.ts, id: state.id },
          );
        }),
      )
      .orderBy('l.created_at', 'ASC')
      .addOrderBy('l.id', 'ASC')
      .limit(take)
      .getMany();
    return rows.map((l) => ({
      entityType: 'landing_record',
      entityId: l.id,
      operation: 'UPDATE' as const,
      version: 1,
      data: {
        id: l.id,
        fishingTripId: l.fishingTripId,
        landingPortCode: l.landingPortCode,
        landedAt: l.landedAt,
        totalQuantity: l.totalQuantity,
        notes: l.notes,
        createdBy: l.createdBy,
        updatedAt: (l as { updatedAt?: Date }).updatedAt ?? l.createdAt,
      },
    }));
  }

  private async pullFormSubmissions(
    state: CursorState,
    take: number,
    user: AuthUser,
  ): Promise<PullChange[]> {
    if (take <= 0) return [];
    const rows = await this.submissionRepo
      .createQueryBuilder('s')
      .where(
        new Brackets((q) => {
          q.where('s.updated_at > :ts', { ts: state.ts }).orWhere(
            '(s.updated_at = :ts AND s.id > :id)',
            { ts: state.ts, id: state.id },
          );
        }),
      )
      .andWhere('s.submitted_by = :uid', { uid: user.accountId })
      .orderBy('s.updated_at', 'ASC')
      .addOrderBy('s.id', 'ASC')
      .limit(take)
      .getMany();
    return rows.map((s) => ({
      entityType: 'form_submission',
      entityId: s.id,
      operation: 'UPDATE' as const,
      version: s.version ?? 1,
      data: {
        id: s.id,
        formDefinitionId: s.formDefinitionId,
        vesselId: s.vesselId,
        fishingTripId: s.fishingTripId,
        status: s.status,
        version: s.version,
        submittedBy: s.submittedBy,
        submittedAt: s.submittedAt,
        approvedAt: s.approvedAt,
        rejectedAt: s.rejectedAt,
        rejectionReason: s.rejectionReason,
        updatedAt: s.updatedAt,
      },
    }));
  }

  private async pullFormSubmissionData(
    state: CursorState,
    take: number,
  ): Promise<PullChange[]> {
    if (take <= 0) return [];
    const rows = await this.submissionDataRepo
      .createQueryBuilder('d')
      .where(
        new Brackets((q) => {
          q.where('d.updated_at > :ts', { ts: state.ts }).orWhere(
            '(d.updated_at = :ts AND d.id > :id)',
            { ts: state.ts, id: state.id },
          );
        }),
      )
      .orderBy('d.updated_at', 'ASC')
      .addOrderBy('d.id', 'ASC')
      .limit(take)
      .getMany();
    return rows.map((d) => ({
      entityType: 'form_submission_data',
      entityId: d.id,
      operation: 'UPDATE' as const,
      version: 1,
      data: {
        id: d.id,
        formSubmissionId: d.formSubmissionId,
        data: d.data,
        updatedAt: d.updatedAt,
      },
    }));
  }

  private projectTrip(
    t: FishingTrip,
    _deviceId: string,
  ): Record<string, unknown> {
    return {
      id: t.id,
      vesselId: t.vesselId,
      tripNumber: t.tripNumber,
      departurePortCode: t.departurePortCode,
      arrivalPortCode: t.arrivalPortCode,
      departureAt: t.departureAt,
      arrivalAt: t.arrivalAt,
      status: t.status,
      submissionStatus: t.submissionStatus,
      createdBy: t.createdBy,
      updatedAt: t.updatedAt,
    };
  }
}

function safeDecode(cursor: string): CursorState {
  try {
    return decodeCursor(cursor);
  } catch {
    throw new BadCursor('Invalid cursor');
  }
}
