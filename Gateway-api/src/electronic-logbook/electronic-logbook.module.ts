/**
 * PHASE 8 — Electronic Logbook module.
 *
 * Registers all 27 eLogbook passthrough controllers under
 * /api/electronic-logbook/* so the full downstream surface appears in Swagger.
 *
 * Aggregation controller (`electronic-logbook-aggregation.controller.ts`) is
 * colocated with other eLogbook controllers and uses superagent inline — it
 * does not require a custom Provider.
 */

import { Module } from '@nestjs/common';

import { ElbSyncController } from './sync.controller';
import { ElbSyncOperationController } from './sync-operation.controller';
import { ElbSyncConflictController } from './sync-conflict.controller';
import { ElbVesselController } from './vessel.controller';
import { ElbVesselOwnerController } from './vessel-owner.controller';
import { ElbVesselCrewController } from './vessel-crew.controller';
import { ElbRegulatoryFormsController } from './regulatory-forms.controller';
import { ElbPortCallController } from './port-call.controller';
import { ElbLandingRecordController } from './landing-record.controller';
import { ElbLandingCatchController } from './landing-catch.controller';
import { ElbIncidentController } from './incident.controller';
import { ElbFuelRecordController } from './fuel-record.controller';
import { ElbFormWorkflowHistoryController } from './form-workflow-history.controller';
import { ElbFormSubmissionController } from './form-submission.controller';
import { ElbFormSubmissionVersionController } from './form-submission-version.controller';
import { ElbFormSubmissionDataController } from './form-submission-data.controller';
import { ElbFormDefinitionController } from './form-definition.controller';
import { ElbFishingTripController } from './fishing-trip.controller';
import { ElbFishingTripGearController } from './fishing-trip-gear.controller';
import { ElbFishingTripCrewController } from './fishing-trip-crew.controller';
import { ElbFishingGearController } from './fishing-gear.controller';
import { ElbClientDeviceController } from './client-device.controller';
import { ElbCatchRecordController } from './catch-record.controller';
import { ElbAttachmentController } from './attachment.controller';
import { ElbFormSubmissionConfirmationController } from './form-submission-confirmation.controller';
import { ElbFishingOperationController } from './fishing-operation.controller';
import { ElbFishingOperationProfileController } from './fishing-operation-profile.controller';
import { ElectronicLogbookAggregationController } from './electronic-logbook-aggregation.controller';

@Module({
  controllers: [
    ElbSyncController,
    ElbSyncOperationController,
    ElbSyncConflictController,
    ElbVesselController,
    ElbVesselOwnerController,
    ElbVesselCrewController,
    ElbRegulatoryFormsController,
    ElbPortCallController,
    ElbLandingRecordController,
    ElbLandingCatchController,
    ElbIncidentController,
    ElbFuelRecordController,
    ElbFormWorkflowHistoryController,
    ElbFormSubmissionController,
    ElbFormSubmissionVersionController,
    ElbFormSubmissionDataController,
    ElbFormDefinitionController,
    ElbFishingTripController,
    ElbFishingTripGearController,
    ElbFishingTripCrewController,
    ElbFishingGearController,
    ElbClientDeviceController,
    ElbCatchRecordController,
    ElbAttachmentController,
    ElbFormSubmissionConfirmationController,
    ElbFishingOperationController,
    ElbFishingOperationProfileController,
    ElectronicLogbookAggregationController,
  ],
})
export class ElectronicLogbookModule {}
