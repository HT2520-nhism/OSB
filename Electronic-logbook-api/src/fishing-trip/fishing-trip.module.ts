import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FishingTrip } from './fishing-trip.entity';
import { FishingTripController } from './fishing-trip.controller';
import { FishingTripService } from './fishing-trip.service';
import { TripOverviewController } from './trip-overview.controller';
import { TripOverviewService } from './trip-overview.service';

import { Vessel } from '../vessel/vessel.entity';
import { VesselOwner } from '../vessel-owner/vessel-owner.entity';
import { VesselCrew } from '../vessel-crew/vessel-crew.entity';
import { FishingTripCrew } from '../fishing-trip-crew/fishing-trip-crew.entity';
import { FishingTripGear } from '../fishing-trip-gear/fishing-trip-gear.entity';
import { FishingOperation } from '../fishing-operation/fishing-operation.entity';
import { CatchRecord } from '../catch-record/catch-record.entity';
import { LandingRecord } from '../landing-record/landing-record.entity';
import { LandingCatch } from '../landing-catch/landing-catch.entity';
import { PortCall } from '../port-call/port-call.entity';
import { FuelRecord } from '../fuel-record/fuel-record.entity';
import { Incident } from '../incident/incident.entity';
import { FormSubmission } from '../form-submission/form-submission.entity';

import { VesselModule } from '../vessel/vessel.module';
import { FormDefinitionModule } from '../form-definition/form-definition.module';
import { DomainEventsModule } from '../domain-events/domain-events.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FishingTrip,
      Vessel,
      VesselOwner,
      VesselCrew,
      FishingTripCrew,
      FishingTripGear,
      FishingOperation,
      CatchRecord,
      LandingRecord,
      LandingCatch,
      PortCall,
      FuelRecord,
      Incident,
      FormSubmission,
    ]),
    VesselModule,
    FormDefinitionModule,
    DomainEventsModule,
    AuthModule,
  ],
  controllers: [FishingTripController, TripOverviewController],
  providers: [FishingTripService, TripOverviewService],
  exports: [FishingTripService, TripOverviewService],
})
export class FishingTripModule {}
