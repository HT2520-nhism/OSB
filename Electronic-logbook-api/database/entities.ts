import { Vessel } from '../src/vessel/vessel.entity';
import { VesselOwner } from '../src/vessel-owner/vessel-owner.entity';
import { VesselCrew } from '../src/vessel-crew/vessel-crew.entity';

import { FishingTrip } from '../src/fishing-trip/fishing-trip.entity';
import { FishingTripCrew } from '../src/fishing-trip-crew/fishing-trip-crew.entity';
import { FishingGear } from '../src/fishing-gear/fishing-gear.entity';
import { FishingTripGear } from '../src/fishing-trip-gear/fishing-trip-gear.entity';
import { FishingOperation } from '../src/fishing-operation/fishing-operation.entity';
import { CatchRecord } from '../src/catch-record/catch-record.entity';

import { LandingRecord } from '../src/landing-record/landing-record.entity';
import { LandingCatch } from '../src/landing-catch/landing-catch.entity';
import { PortCall } from '../src/port-call/port-call.entity';
import { FuelRecord } from '../src/fuel-record/fuel-record.entity';

import { Incident } from '../src/incident/incident.entity';

import { FormDefinition } from '../src/form-definition/form-definition.entity';
import { FormSubmission } from '../src/form-submission/form-submission.entity';
import { FormSubmissionData } from '../src/form-submission-data/form-submission-data.entity';
import { FormSubmissionVersion } from '../src/form-submission-version/form-submission-version.entity';
import { FormWorkflowHistory } from '../src/form-workflow-history/form-workflow-history.entity';
import { FormSubmissionConfirmation } from '../src/form-submission-confirmation/form-submission-confirmation.entity';
import { Attachment } from '../src/attachment/attachment.entity';

import { ClientDevice } from '../src/client-device/client-device.entity';
import { SyncOperation } from '../src/sync-operation/sync-operation.entity';
import { SyncConflict } from '../src/sync-conflict/sync-conflict.entity';
import { OutboxEvent } from '../src/outbox-event/outbox-event.entity';

/**
 * Tập hợp các entity của electronic-logbook-api.
 *
 * Được dùng cho migration CLI:
 *   ts-node ./node_modules/typeorm/cli.js -d database/entities.ts migration:run
 *
 * Runtime: TypeORM tự load qua glob 'src/**\/*.entity.ts' trong ormconfig.ts.
 */
export const ENTITIES = [
  // ===== Vessel =====
  Vessel,
  VesselOwner,
  VesselCrew,

  // ===== Fishing =====
  FishingTrip,
  FishingTripCrew,
  FishingGear,
  FishingTripGear,
  FishingOperation,
  CatchRecord,

  // ===== Landing & Port =====
  LandingRecord,
  LandingCatch,
  PortCall,
  FuelRecord,

  // ===== Incident =====
  Incident,

  // ===== Forms =====
  FormDefinition,
  FormSubmission,
  FormSubmissionData,
  FormSubmissionVersion,
  FormWorkflowHistory,
  FormSubmissionConfirmation,
  Attachment,

  // ===== Sync & Outbox =====
  ClientDevice,
  SyncOperation,
  SyncConflict,
  OutboxEvent,
];
