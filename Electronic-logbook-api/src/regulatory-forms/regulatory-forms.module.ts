import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RegulatoryFormsService } from './regulatory-forms.service';
import { RegulatoryFormsController } from './regulatory-forms.controller';

import { FormDefinition } from '../form-definition/form-definition.entity';
import { Vessel } from '../vessel/vessel.entity';
import { VesselOwner } from '../vessel-owner/vessel-owner.entity';
import { VesselCrew } from '../vessel-crew/vessel-crew.entity';
import { FishingTrip } from '../fishing-trip/fishing-trip.entity';
import { FishingTripCrew } from '../fishing-trip-crew/fishing-trip-crew.entity';
import { FishingTripGear } from '../fishing-trip-gear/fishing-trip-gear.entity';
import { LandingRecord } from '../landing-record/landing-record.entity';
import { LandingCatch } from '../landing-catch/landing-catch.entity';
import { FishingOperation } from '../fishing-operation/fishing-operation.entity';
import { CatchRecord } from '../catch-record/catch-record.entity';

import { FormSubmissionModule } from '../form-submission/form-submission.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FormDefinition,
      Vessel,
      VesselOwner,
      VesselCrew,
      FishingTrip,
      FishingTripCrew,
      FishingTripGear,
      LandingRecord,
      LandingCatch,
      FishingOperation,
      CatchRecord,
    ]),
    FormSubmissionModule,
    AuthModule,
  ],
  controllers: [RegulatoryFormsController],
  providers: [RegulatoryFormsService],
  exports: [RegulatoryFormsService],
})
export class RegulatoryFormsModule {}
