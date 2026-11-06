/**
 * Fishing Trip State Machine
 *
 * Lifecycle (happy path):
 *   DRAFT -> PREPARING -> DEPARTED -> FISHING -> RETURNING -> COMPLETED
 *
 * Cancellation rules:
 *   CANCELLED is reachable from non-terminal states only.
 *   (DRAFT, PREPARING, DEPARTED, FISHING, RETURNING)
 *
 * Terminal states: COMPLETED, CANCELLED.
 *
 * Any direct attempt to mutate status through PATCH /fishing-trips/:id
 * is rejected by the service — callers must use explicit transitions.
 */

import { BadRequestException } from '@nestjs/common';

import {
  FishingTripStatus,
  VesselStatus,
} from '../../constants/enums/domain.enum';

/** Edges of the state machine: from -> allowed targets. */
const ALLOWED_TRANSITIONS: Readonly<
  Record<FishingTripStatus, ReadonlyArray<FishingTripStatus>>
> = {
  [FishingTripStatus.DRAFT]: [
    FishingTripStatus.PREPARING,
    FishingTripStatus.CANCELLED,
  ],
  [FishingTripStatus.PREPARING]: [
    FishingTripStatus.DEPARTED,
    FishingTripStatus.CANCELLED,
  ],
  [FishingTripStatus.DEPARTED]: [
    FishingTripStatus.FISHING,
    FishingTripStatus.CANCELLED,
  ],
  [FishingTripStatus.FISHING]: [
    FishingTripStatus.RETURNING,
    FishingTripStatus.CANCELLED,
  ],
  [FishingTripStatus.RETURNING]: [
    FishingTripStatus.COMPLETED,
    FishingTripStatus.CANCELLED,
  ],
  [FishingTripStatus.COMPLETED]: [],
  [FishingTripStatus.CANCELLED]: [],
};

export const TERMINAL_TRIP_STATUSES: ReadonlyArray<FishingTripStatus> = [
  FishingTripStatus.COMPLETED,
  FishingTripStatus.CANCELLED,
];

/**
 * Whether a vessel in the given vessel status may host a new fishing trip.
 * DECOMMISSIONED vessels are not allowed.
 */
export function assertVesselCanHostTrip(
  vesselStatus: string | null | undefined,
): void {
  if (!vesselStatus) {
    throw new BadRequestException(
      'Vessel must have a status before a trip can be created',
    );
  }
  if (vesselStatus === VesselStatus.DECOMMISSIONED) {
    throw new BadRequestException(
      'Cannot create a fishing trip for a DECOMMISSIONED vessel',
    );
  }
}

export function isTerminalTripStatus(
  status: FishingTripStatus | string | null | undefined,
): boolean {
  if (!status) return false;
  return TERMINAL_TRIP_STATUSES.includes(status as FishingTripStatus);
}

/**
 * Whether `from -> to` is a permitted transition.
 */
export function canTransitionTripStatus(
  from: FishingTripStatus | string | null | undefined,
  to: FishingTripStatus | string,
): boolean {
  if (!from) return false;
  const allowed = ALLOWED_TRANSITIONS[from as FishingTripStatus];
  if (!allowed) return false;
  return allowed.includes(to as FishingTripStatus);
}

/**
 * Assert that `from -> to` is a permitted transition.
 * Throws BadRequestException otherwise with a descriptive error.
 */
export function assertTripStatusTransition(
  from: FishingTripStatus | string | null | undefined,
  to: FishingTripStatus | string,
): void {
  if (!canTransitionTripStatus(from, to)) {
    throw new BadRequestException(
      `Invalid fishing trip status transition: ${String(from)} -> ${String(
        to,
      )}`,
    );
  }
}

/**
 * Validate that a new trip is allowed to be created for a vessel in the
 * given vessel status.
 */
