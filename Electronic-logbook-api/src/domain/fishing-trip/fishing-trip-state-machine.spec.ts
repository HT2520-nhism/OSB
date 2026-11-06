/**
 * PHASE 5.11 — Fishing Trip State Machine Tests
 */

import { FishingTripStatus } from '../../constants/enums/domain.enum';
import {
  canTransitionTripStatus,
  assertTripStatusTransition,
  assertVesselCanHostTrip,
  isTerminalTripStatus,
  TERMINAL_TRIP_STATUSES,
} from './fishing-trip-state-machine';

describe('FishingTripStateMachine', () => {
  it('allows happy-path transitions', () => {
    expect(
      canTransitionTripStatus(
        FishingTripStatus.DRAFT,
        FishingTripStatus.PREPARING,
      ),
    ).toBe(true);
    expect(
      canTransitionTripStatus(
        FishingTripStatus.PREPARING,
        FishingTripStatus.DEPARTED,
      ),
    ).toBe(true);
    expect(
      canTransitionTripStatus(
        FishingTripStatus.DEPARTED,
        FishingTripStatus.FISHING,
      ),
    ).toBe(true);
    expect(
      canTransitionTripStatus(
        FishingTripStatus.FISHING,
        FishingTripStatus.RETURNING,
      ),
    ).toBe(true);
    expect(
      canTransitionTripStatus(
        FishingTripStatus.RETURNING,
        FishingTripStatus.COMPLETED,
      ),
    ).toBe(true);
  });

  it('allows cancellation from non-terminal states', () => {
    for (const s of [
      FishingTripStatus.DRAFT,
      FishingTripStatus.PREPARING,
      FishingTripStatus.DEPARTED,
      FishingTripStatus.FISHING,
      FishingTripStatus.RETURNING,
    ]) {
      expect(canTransitionTripStatus(s, FishingTripStatus.CANCELLED)).toBe(
        true,
      );
    }
  });

  it('rejects invalid transitions', () => {
    expect(() =>
      assertTripStatusTransition(
        FishingTripStatus.COMPLETED,
        FishingTripStatus.FISHING,
      ),
    ).toThrow();
    expect(() =>
      assertTripStatusTransition(
        FishingTripStatus.COMPLETED,
        FishingTripStatus.DEPARTED,
      ),
    ).toThrow();
    expect(() =>
      assertTripStatusTransition(
        FishingTripStatus.CANCELLED,
        FishingTripStatus.FISHING,
      ),
    ).toThrow();
    expect(() =>
      assertTripStatusTransition(
        FishingTripStatus.CANCELLED,
        FishingTripStatus.COMPLETED,
      ),
    ).toThrow();
  });

  it('marks terminal statuses correctly', () => {
    expect(TERMINAL_TRIP_STATUSES).toEqual(
      expect.arrayContaining([
        FishingTripStatus.COMPLETED,
        FishingTripStatus.CANCELLED,
      ]),
    );
    expect(isTerminalTripStatus(FishingTripStatus.COMPLETED)).toBe(true);
    expect(isTerminalTripStatus(FishingTripStatus.CANCELLED)).toBe(true);
    expect(isTerminalTripStatus(FishingTripStatus.DRAFT)).toBe(false);
    expect(isTerminalTripStatus(null)).toBe(false);
  });

  it('validates vessel host capability', () => {
    expect(() => assertVesselCanHostTrip(null)).toThrow();
    expect(() => assertVesselCanHostTrip('DECOMMISSIONED')).toThrow();
    expect(() => assertVesselCanHostTrip('ACTIVE')).not.toThrow();
  });
});
