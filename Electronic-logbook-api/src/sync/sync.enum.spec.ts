/**
 * PHASE 6 — Sync Operation Status enum
 */

import {
  SyncConflictResolution,
  SyncDeviceStatus,
  SyncEntityType,
  SyncErrorCode,
  SyncOperationStatus,
  SyncOperationType,
} from './sync.enum';

describe('SyncEnums', () => {
  it('operation status values are stable strings', () => {
    expect(SyncOperationStatus.COMPLETED).toBe('COMPLETED');
    expect(SyncOperationStatus.FAILED).toBe('FAILED');
    expect(SyncOperationStatus.CONFLICT).toBe('CONFLICT');
    expect(SyncOperationStatus.RETRYABLE).toBe('RETRYABLE');
  });

  it('operation type whitelist', () => {
    expect(SyncOperationType.CREATE).toBe('CREATE');
    expect(SyncOperationType.UPDATE).toBe('UPDATE');
    expect(SyncOperationType.DELETE).toBe('DELETE');
  });

  it('entity type whitelist excludes arbitrary table names', () => {
    expect(SyncEntityType.FISHING_TRIP).toBe('fishing_trip');
    expect(SyncEntityType.FORM_SUBMISSION).toBe('form_submission');
    // Random string is not in the enum
    expect(SyncEntityType['SOME_RANDOM_THING']).toBeUndefined();
  });

  it('device status values are controlled', () => {
    expect(SyncDeviceStatus.ACTIVE).toBe('ACTIVE');
    expect(SyncDeviceStatus.INACTIVE).toBe('INACTIVE');
    expect(SyncDeviceStatus.REVOKED).toBe('REVOKED');
  });

  it('conflict resolution values are controlled', () => {
    expect(SyncConflictResolution.SERVER_WINS).toBe('SERVER_WINS');
    expect(SyncConflictResolution.CLIENT_WINS).toBe('CLIENT_WINS');
    expect(SyncConflictResolution.MANUAL).toBe('MANUAL');
    expect(SyncConflictResolution.MERGED).toBe('MERGED');
  });

  it('error code values exist', () => {
    expect(SyncErrorCode.VERSION_CONFLICT).toBe('VERSION_CONFLICT');
    expect(SyncErrorCode.INVALID_STATE_TRANSITION).toBe(
      'INVALID_STATE_TRANSITION',
    );
    expect(SyncErrorCode.DEVICE_NOT_AUTHORIZED).toBe('DEVICE_NOT_AUTHORIZED');
  });
});
