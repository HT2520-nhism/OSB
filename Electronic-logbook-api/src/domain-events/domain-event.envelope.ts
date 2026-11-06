/**
 * PHASE 7 — Domain Event envelope + canonical event types.
 *
 * Events represent COMPLETED business facts. Naming:
 *   <Aggregate><PastTenseAction>
 *
 * This file is the single source of truth for the typed event contract.
 */

export const DOMAIN_EVENT_VERSION = 1;

export const OutboxStatus = {
  PENDING: 'pending',
  IN_FLIGHT: 'in_flight',
  PUBLISHED: 'published',
  FAILED: 'failed',
  PERMANENTLY_FAILED: 'permanently_failed',
} as const;

export type OutboxStatusValue =
  (typeof OutboxStatus)[keyof typeof OutboxStatus];

export interface DomainEventActor {
  userId?: string;
  deviceId?: string;
}

export interface DomainEventEnvelope<T extends string = string> {
  eventId: string;
  eventType: T;
  aggregateType: string;
  aggregateId: string;
  occurredAt: string;
  actor?: DomainEventActor;
  correlationId?: string | null;
  causationId?: string | null;
  version: number;
  payload: Record<string, unknown>;
}

/** Canonical event names. Used by the Phase 5 services / handlers. */
export const DomainEventType = {
  // Vessel
  VesselCreated: 'VesselCreated',
  VesselUpdated: 'VesselUpdated',

  // Fishing Trip lifecycle
  FishingTripCreated: 'FishingTripCreated',
  FishingTripPrepared: 'FishingTripPrepared',
  FishingTripDeparted: 'FishingTripDeparted',
  FishingTripStartedFishing: 'FishingTripStartedFishing',
  FishingTripReturning: 'FishingTripReturning',
  FishingTripCompleted: 'FishingTripCompleted',
  FishingTripCancelled: 'FishingTripCancelled',

  // Operations, catches, landings
  FishingOperationCreated: 'FishingOperationCreated',
  CatchRecordCreated: 'CatchRecordCreated',
  LandingRecorded: 'LandingRecorded',
  PortCallCreated: 'PortCallCreated',
  FuelRecordCreated: 'FuelRecordCreated',

  // Incidents
  IncidentCreated: 'IncidentCreated',

  // Form submissions
  FormSubmissionCreated: 'FormSubmissionCreated',
  FormSubmissionSubmitted: 'FormSubmissionSubmitted',
  FormSubmissionUnderReview: 'FormSubmissionUnderReview',
  FormSubmissionApproved: 'FormSubmissionApproved',
  FormSubmissionRejected: 'FormSubmissionRejected',
  FormSubmissionCancelled: 'FormSubmissionCancelled',
  FormSubmissionVersionCreated: 'FormSubmissionVersionCreated',
  FormWorkflowChanged: 'FormWorkflowChanged',

  // Form confirmation (Mẫu 01)
  FormSubmissionConfirmed: 'FormSubmissionConfirmed',
  FormSubmissionRemainingQuantityRecalculated:
    'FormSubmissionRemainingQuantityRecalculated',
} as const;

export type DomainEventTypeValue =
  (typeof DomainEventType)[keyof typeof DomainEventType];

/**
 * Compile-time sanity check: ensure every event name begins with an
 * uppercase letter (PascalCase) and never contains underscores as the
 * first separator.
 */
export function isKnownEventType(name: string): name is DomainEventTypeValue {
  return Object.values(DomainEventType).includes(name as DomainEventTypeValue);
}
