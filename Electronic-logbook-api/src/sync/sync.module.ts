/**
 * PHASE 6 — Sync Module.
 *
 * Wires:
 *  - SyncController, SyncPushService, SyncPullService
 *  - SyncDeviceService, SyncIdempotencyService, SyncConflictService
 *  - Entity handlers (FishingTrip, FormSubmission, M01)
 *  - Domain services (FishingTripService, FormSubmissionService, ...)
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SyncController } from './sync.controller';
import { SyncPushService } from './sync-push.service';
import { SyncPullService } from './sync-pull.service';
import { SyncDeviceService } from './sync-device.service';
import { SyncIdempotencyService } from './sync-idempotency.service';
import { SyncConflictService } from './sync-conflict.service';

import { SyncEntityHandler } from './handlers/sync-handler.interface';
import { FishingTripSyncHandler } from './handlers/fishing-trip-sync.handler';
import { FormSubmissionSyncHandler } from './handlers/form-submission-sync.handler';
import { FormM01SyncHandler } from './handlers/form-m01-sync.handler';
import { SYNC_ENTITY_HANDLERS } from './sync-handler.tokens';

import { ClientDevice } from '../client-device/client-device.entity';
import { SyncOperation } from '../sync-operation/sync-operation.entity';
import { SyncConflict } from '../sync-conflict/sync-conflict.entity';

import { FishingTrip } from '../fishing-trip/fishing-trip.entity';
import { FishingTripCrew } from '../fishing-trip-crew/fishing-trip-crew.entity';
import { FishingTripGear } from '../fishing-trip-gear/fishing-trip-gear.entity';
import { FishingOperation } from '../fishing-operation/fishing-operation.entity';
import { CatchRecord } from '../catch-record/catch-record.entity';
import { PortCall } from '../port-call/port-call.entity';
import { FuelRecord } from '../fuel-record/fuel-record.entity';
import { Incident } from '../incident/incident.entity';

import { LandingRecord } from '../landing-record/landing-record.entity';
import { LandingCatch } from '../landing-catch/landing-catch.entity';

import { FormSubmission } from '../form-submission/form-submission.entity';
import { FormSubmissionData } from '../form-submission-data/form-submission-data.entity';
import { FormSubmissionConfirmation } from '../form-submission-confirmation/form-submission-confirmation.entity';
import { OutboxEvent } from '../outbox-event/outbox-event.entity';

import { FishingTripModule } from '../fishing-trip/fishing-trip.module';
import { FormSubmissionModule } from '../form-submission/form-submission.module';
import { FormSubmissionConfirmationModule } from '../form-submission-confirmation/form-submission-confirmation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClientDevice,
      SyncOperation,
      SyncConflict,
      FishingTrip,
      FishingTripCrew,
      FishingTripGear,
      FishingOperation,
      CatchRecord,
      PortCall,
      FuelRecord,
      Incident,
      LandingRecord,
      LandingCatch,
      FormSubmission,
      FormSubmissionData,
      FormSubmissionConfirmation,
      OutboxEvent,
    ]),
    FishingTripModule,
    FormSubmissionModule,
    FormSubmissionConfirmationModule,
  ],
  controllers: [SyncController],
  providers: [
    SyncPushService,
    SyncPullService,
    SyncDeviceService,
    SyncIdempotencyService,
    SyncConflictService,
    FishingTripSyncHandler,
    FormSubmissionSyncHandler,
    FormM01SyncHandler,
    {
      provide: SYNC_ENTITY_HANDLERS,
      useFactory: (
        ft: FishingTripSyncHandler,
        fs: FormSubmissionSyncHandler,
        m1: FormM01SyncHandler,
      ): SyncEntityHandler[] => [ft, fs, m1],
      inject: [
        FishingTripSyncHandler,
        FormSubmissionSyncHandler,
        FormM01SyncHandler,
      ],
    },
  ],
  exports: [
    SyncPushService,
    SyncPullService,
    SyncDeviceService,
    SyncIdempotencyService,
    SyncConflictService,
  ],
})
export class SyncModule {}
