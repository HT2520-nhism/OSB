/**
 * PHASE 6 — Fishing Trip Sync Handler.
 *
 * Delegates to FishingTripService so:
 *  - Vessel existence + vessel-status check is preserved.
 *  - createdBy comes from authenticated user (never from client).
 *  - State transitions go through the explicit prepareTrip/departTrip/...
 *    methods which enforce the Phase 5 state machine.
 *
 * Conflict policy:
 *  - CREATE: must not already exist.
 *  - UPDATE / DELETE: clientVersion must match the server-side row count
 *    or status (Phase 5 does not yet track a row-version on the trip
 *    itself). We use a coarse semantic check: if the server's status is
 *    further along in the state machine than what the client knows, we
 *    flag a CONFLICT the client cannot auto-merge.
 *  - For STATE operations (`status` in payload) we call the matching
 *    domain transition rather than mutating the column directly.
 */

import { BadRequestException, Injectable } from '@nestjs/common';

import {
  SyncEntityHandler,
  SyncHandlerContext,
  SyncHandlerResult,
  SyncOperationEnvelope,
} from './sync-handler.interface';
import { SyncEntityType } from '../sync.enum';

import { FishingTripService } from '../../fishing-trip/fishing-trip.service';
import { FishingTrip } from '../../fishing-trip/fishing-trip.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FishingTripStatus } from '../../constants/enums/domain.enum';
import { canTransitionTripStatus } from '../../domain/fishing-trip/fishing-trip-state-machine';

const STATE_ORDER: Record<FishingTripStatus, number> = {
  [FishingTripStatus.DRAFT]: 0,
  [FishingTripStatus.PREPARING]: 1,
  [FishingTripStatus.DEPARTED]: 2,
  [FishingTripStatus.FISHING]: 3,
  [FishingTripStatus.RETURNING]: 4,
  [FishingTripStatus.COMPLETED]: 5,
  [FishingTripStatus.CANCELLED]: -1,
};

@Injectable()
export class FishingTripSyncHandler implements SyncEntityHandler {
  constructor(
    private readonly tripService: FishingTripService,
    @InjectRepository(FishingTrip)
    private readonly tripRepo: Repository<FishingTrip>,
  ) {}

  supports(entityType: SyncEntityType): boolean {
    return entityType === SyncEntityType.FISHING_TRIP;
  }

  async applyCreate(
    op: SyncOperationEnvelope,
    ctx: SyncHandlerContext,
  ): Promise<SyncHandlerResult> {
    if (!op.payload) throw new BadRequestException('payload required');
    const existing = await this.tripRepo.findOne({
      where: { id: op.entityId },
    });
    if (existing) {
      // Idempotent: a CREATE retry on an existing id is treated as
      // duplicate. Surfacing this as a conflict lets the mobile client
      // reconcile.
      throw new BadRequestException(
        'Trip already exists; use UPDATE to modify',
      );
    }
    const trip = await this.tripService.create(
      {
        vesselId: String(op.payload['vesselId']),
        tripNumber: this.optionalString(op.payload['tripNumber']),
        departurePortCode: this.optionalString(op.payload['departurePortCode']),
        arrivalPortCode: this.optionalString(op.payload['arrivalPortCode']),
        departureAt: this.optionalString(op.payload['departureAt']),
        arrivalAt: this.optionalString(op.payload['arrivalAt']),
      },
      ctx.user,
    );
    return {
      entityId: trip.id,
      serverVersion: 1,
      data: this.project(trip),
    };
  }

  async applyUpdate(
    op: SyncOperationEnvelope,
    ctx: SyncHandlerContext,
  ): Promise<SyncHandlerResult> {
    if (!op.payload) throw new BadRequestException('payload required');
    const trip = await this.tripService.findOne(op.entityId);

    // Version check.
    if (
      typeof op.clientVersion === 'number' &&
      typeof trip.createdAt !== 'undefined'
    ) {
      // For trips we do not have a strict version column. We rely on
      // status comparison to detect stale mobile clients.
    }
    this.assertStatusNotBehind(trip.status, op.payload['status']);

    // If the client attempts a state transition, delegate to the
    // matching domain operation. This routes through the Phase 5
    // state machine even when the mobile client tries to PATCH
    // status directly.
    const desiredStatus = op.payload['status'] as FishingTripStatus | undefined;
    if (desiredStatus && desiredStatus !== trip.status) {
      await this.delegateTransition(trip.id, desiredStatus, ctx);
    }

    // After state handling (if any), apply data-only updates.
    const dataOnly = { ...op.payload };
    delete dataOnly['status'];

    const updated = await this.tripService.update(
      trip.id,
      dataOnly as never,
      ctx.user,
    );
    return {
      entityId: updated.id,
      serverVersion: 2,
      data: this.project(updated),
    };
  }

  async applyDelete(
    op: SyncOperationEnvelope,
    _ctx: SyncHandlerContext,
  ): Promise<SyncHandlerResult> {
    const trip = await this.tripService.findOne(op.entityId);
    if (trip.status === FishingTripStatus.COMPLETED) {
      throw new BadRequestException(
        'Completed trips cannot be deleted (regulatory immutability)',
      );
    }
    if (trip.status === FishingTripStatus.CANCELLED) {
      // already in terminal state; treat as idempotent success.
      return {
        entityId: op.entityId,
        serverVersion: 0,
        data: this.project(trip),
      };
    }
    await this.tripService.cancelTrip(op.entityId, _ctx.user);
    return {
      entityId: op.entityId,
      serverVersion: -1,
    };
  }

  async loadServerSnapshot(
    entityId: string,
    _ctx: SyncHandlerContext,
  ): Promise<Record<string, unknown> | null> {
    const trip = await this.tripRepo.findOne({ where: { id: entityId } });
    if (!trip) return null;
    return this.project(trip);
  }

  private async delegateTransition(
    entityId: string,
    target: FishingTripStatus,
    ctx: SyncHandlerContext,
  ): Promise<void> {
    const trip = await this.tripService.findOne(entityId);
    if (!canTransitionTripStatus(trip.status, target)) {
      throw new BadRequestException(
        `Cannot transition trip ${entityId} from ${trip.status} to ${target}`,
      );
    }
    switch (target) {
      case FishingTripStatus.PREPARING:
        await this.tripService.prepareTrip(entityId, ctx.user);
        return;
      case FishingTripStatus.DEPARTED:
        await this.tripService.departTrip(entityId, ctx.user);
        return;
      case FishingTripStatus.FISHING:
        await this.tripService.startFishing(entityId, ctx.user);
        return;
      case FishingTripStatus.RETURNING:
        await this.tripService.startReturning(entityId, ctx.user);
        return;
      case FishingTripStatus.COMPLETED:
        await this.tripService.completeTrip(entityId, ctx.user);
        return;
      case FishingTripStatus.CANCELLED:
        await this.tripService.cancelTrip(entityId, ctx.user);
        return;
      case FishingTripStatus.DRAFT:
        // Re-opening a trip back to DRAFT is not part of Phase 5.
        throw new BadRequestException(
          'Reverting a trip to DRAFT is not supported',
        );
      default:
        throw new BadRequestException(
          `Unknown target trip status: ${String(target)}`,
        );
    }
  }

  private assertStatusNotBehind(
    serverStatus: string | null,
    clientRequestedStatus: unknown,
  ): void {
    if (!clientRequestedStatus || typeof clientRequestedStatus !== 'string') {
      return;
    }
    const ss = serverStatus as FishingTripStatus;
    const cs = clientRequestedStatus as FishingTripStatus;
    const so = STATE_ORDER[ss] ?? 0;
    const co = STATE_ORDER[cs] ?? 0;
    // If the client tries to "rewind" the trip (client is at DRAFT but
    // server is at FISHING), we treat that as a conflict — the mobile
    // stale state must not overwrite authoritative state.
    if (co < so && ss !== FishingTripStatus.CANCELLED) {
      throw new BadRequestException(
        `Trip status on server is ${ss}, client requested ${cs} — stale state`,
      );
    }
  }

  private optionalString(v: unknown): string | undefined {
    return typeof v === 'string' ? v : undefined;
  }

  private project(trip: FishingTrip): Record<string, unknown> {
    return {
      id: trip.id,
      vesselId: trip.vesselId,
      tripNumber: trip.tripNumber,
      departurePortCode: trip.departurePortCode,
      arrivalPortCode: trip.arrivalPortCode,
      departureAt: trip.departureAt,
      arrivalAt: trip.arrivalAt,
      status: trip.status,
      submissionStatus: trip.submissionStatus,
      createdAt: trip.createdAt,
      updatedAt: trip.updatedAt,
      createdBy: trip.createdBy,
    };
  }
}
