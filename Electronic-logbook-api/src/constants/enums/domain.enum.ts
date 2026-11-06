/**
 * Domain enums for Electronic Fishing Logbook.
 *
 * These enums centralize the lifecycle states of business workflows
 * (Fishing Trip, Form Submission) so that controllers, services,
 * DTOs and database varchar columns all share one source of truth.
 *
 * IMPORTANT: The string values are the exact strings stored in the
 * PostgreSQL `varchar` columns. Changing a value here is a DB break.
 */

export enum FishingTripStatus {
  DRAFT = 'DRAFT',
  PREPARING = 'PREPARING',
  DEPARTED = 'DEPARTED',
  FISHING = 'FISHING',
  RETURNING = 'RETURNING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum FishingTripSubmissionStatus {
  NOT_SUBMITTED = 'NOT_SUBMITTED',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum VesselStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  DECOMMISSIONED = 'DECOMMISSIONED',
}

export enum FormSubmissionStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

/**
 * Mirror of `FishingTrip.submissionStatus` — kept separately to avoid
 * a circular import with the fishing-trip module.
 */
export enum FormSubmissionSubmissionStatus {
  NOT_SUBMITTED = 'NOT_SUBMITTED',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum FormSubmissionConfirmationType {
  INITIAL = 'INITIAL',
  RESALE = 'RESALE',
  COA = 'COA',
  EXPORT = 'EXPORT',
}

export enum PortCallType {
  DEPARTURE = 'DEPARTURE',
  ARRIVAL = 'ARRIVAL',
  TRANSIT = 'TRANSIT',
  EMERGENCY = 'EMERGENCY',
}

export enum FuelRecordType {
  BEFORE_DEPARTURE = 'BEFORE_DEPARTURE',
  REFUEL = 'REFUEL',
  CONSUMPTION = 'CONSUMPTION',
  ARRIVAL = 'ARRIVAL',
}

export enum CrewRole {
  CAPTAIN = 'CAPTAIN',
  CREW = 'CREW',
  FISHERMAN = 'FISHERMAN',
  OTHER = 'OTHER',
}

export enum FishingOperationType {
  TRAWL = 'TRAWL',
  PURSE_SEINE = 'PURSE_SEINE',
  SURROUNDING_NET = 'SURROUNDING_NET',
  HOOK_LINE = 'HOOK_LINE',
  GILLNET = 'GILLNET',
  TRAPS_CAGES = 'TRAPS_CAGES',
  OTHER = 'OTHER',
}

/**
 * Regulatory form codes (Mẫu).
 * Used by FormDefinition.formCode and matched against business workflows.
 */
export enum RegulatoryFormCode {
  M01 = 'M01',
  M02 = 'M02',
  M03 = 'M03',
  NKKT = 'NKKT',
}
