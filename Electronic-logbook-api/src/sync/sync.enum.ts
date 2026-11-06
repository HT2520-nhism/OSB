/**
 * PHASE 6 — Synchronization Operation Status.
 *
 * Status that the server returns to the mobile client per operation.
 *  COMPLETED   — successfully applied (idempotent on retry)
 *  FAILED      — non-retryable client-side problem
 *  CONFLICT    — server has newer / different state
 *  RETRYABLE   — transient infrastructure issue, safe to retry
 */

export enum SyncOperationStatus {
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CONFLICT = 'CONFLICT',
  RETRYABLE = 'RETRYABLE',
}

export enum SyncOperationType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export enum SyncDeviceStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  REVOKED = 'REVOKED',
}

export enum SyncConflictResolution {
  SERVER_WINS = 'SERVER_WINS',
  CLIENT_WINS = 'CLIENT_WINS',
  MANUAL = 'MANUAL',
  MERGED = 'MERGED',
}

export enum SyncErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  VERSION_CONFLICT = 'VERSION_CONFLICT',
  INVALID_STATE_TRANSITION = 'INVALID_STATE_TRANSITION',
  DUPLICATE_OPERATION = 'DUPLICATE_OPERATION',
  DEVICE_NOT_AUTHORIZED = 'DEVICE_NOT_AUTHORIZED',
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  TEMPORARY_ERROR = 'TEMPORARY_ERROR',
  UNSUPPORTED_ENTITY = 'UNSUPPORTED_ENTITY',
}

/**
 * Entity types that the sync API understands.
 * Anything outside this whitelist is rejected.
 */
export enum SyncEntityType {
  FISHING_TRIP = 'fishing_trip',
  FISHING_TRIP_CREW = 'fishing_trip_crew',
  FISHING_TRIP_GEAR = 'fishing_trip_gear',
  FISHING_OPERATION = 'fishing_operation',
  CATCH_RECORD = 'catch_record',
  LANDING_RECORD = 'landing_record',
  LANDING_CATCH = 'landing_catch',
  PORT_CALL = 'port_call',
  FUEL_RECORD = 'fuel_record',
  INCIDENT = 'incident',
  FORM_SUBMISSION = 'form_submission',
  FORM_SUBMISSION_DATA = 'form_submission_data',
}
