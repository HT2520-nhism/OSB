import { Global, MiddlewareConsumer, Module } from '@nestjs/common';

import DatabaseModule from './database.module';

import { LoggerMiddleware } from './services/logger.service';

import { LogbookJwtStrategy } from './auth/jwt.strategy';
import { LogbookJwtAuthGuard } from './auth/jwt-auth.guard';
import { FishermanRolesGuard } from './auth/fisherman-roles.guard';
import { SystemRoleGuard } from './auth/system-role.guard';
import { VesselMembershipRoleGuard } from './auth/vessel-membership-role.guard';
import { AuthModule } from './auth/auth.module';

import { VesselModule } from './vessel/vessel.module';
import { VesselOwnerModule } from './vessel-owner/vessel-owner.module';
import { VesselCrewModule } from './vessel-crew/vessel-crew.module';
import { FishingTripModule } from './fishing-trip/fishing-trip.module';
import { FishingTripCrewModule } from './fishing-trip-crew/fishing-trip-crew.module';
import { FishingGearModule } from './fishing-gear/fishing-gear.module';
import { FishingTripGearModule } from './fishing-trip-gear/fishing-trip-gear.module';
import { FishingOperationModule } from './fishing-operation/fishing-operation.module';
import { CatchRecordModule } from './catch-record/catch-record.module';
import { LandingRecordModule } from './landing-record/landing-record.module';
import { LandingCatchModule } from './landing-catch/landing-catch.module';
import { PortCallModule } from './port-call/port-call.module';
import { FuelRecordModule } from './fuel-record/fuel-record.module';
import { IncidentModule } from './incident/incident.module';
import { FormDefinitionModule } from './form-definition/form-definition.module';
import { FormSubmissionModule } from './form-submission/form-submission.module';
import { FormSubmissionDataModule } from './form-submission-data/form-submission-data.module';
import { FormSubmissionVersionModule } from './form-submission-version/form-submission-version.module';
import { FormWorkflowHistoryModule } from './form-workflow-history/form-workflow-history.module';
import { FormSubmissionConfirmationModule } from './form-submission-confirmation/form-submission-confirmation.module';
import { RegulatoryFormsModule } from './regulatory-forms/regulatory-forms.module';
import { AttachmentModule } from './attachment/attachment.module';
import { SyncModule } from './sync/sync.module';
import { ClientDeviceModule } from './client-device/client-device.module';
import { SyncOperationModule } from './sync-operation/sync-operation.module';
import { SyncConflictModule } from './sync-conflict/sync-conflict.module';
import { OutboxEventModule } from './outbox-event/outbox-event.module';
import { DomainEventsModule } from './domain-events/domain-events.module';
import { DocumentClientModule } from './document-client/document-client.module';
import { FishingOperationProfileModule } from './fishing-operation-profile/fishing-operation-profile.module';

@Global()
@Module({
  imports: [
    AuthModule,
    DomainEventsModule,
    VesselModule,
    VesselOwnerModule,
    VesselCrewModule,
    FishingTripModule,
    FishingTripCrewModule,
    FishingGearModule,
    FishingTripGearModule,
    FishingOperationModule,
    CatchRecordModule,
    LandingRecordModule,
    LandingCatchModule,
    PortCallModule,
    FuelRecordModule,
    IncidentModule,
    FormDefinitionModule,
    FormSubmissionModule,
    FormSubmissionDataModule,
    FormSubmissionVersionModule,
    FormWorkflowHistoryModule,
    FormSubmissionConfirmationModule,
    RegulatoryFormsModule,
    AttachmentModule,
    SyncModule,
    ClientDeviceModule,
    SyncOperationModule,
    SyncConflictModule,
    OutboxEventModule,
    DocumentClientModule,
    FishingOperationProfileModule,
    DatabaseModule,
  ],
  providers: [
    LogbookJwtStrategy,
    LogbookJwtAuthGuard,
    FishermanRolesGuard,
    SystemRoleGuard,
    VesselMembershipRoleGuard,
  ],
  exports: [
    LogbookJwtStrategy,
    LogbookJwtAuthGuard,
    FishermanRolesGuard,
    SystemRoleGuard,
    VesselMembershipRoleGuard,
    OutboxEventModule,
    DomainEventsModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).exclude('/docs').forRoutes('/');
  }
}
