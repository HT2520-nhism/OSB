import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LandingRecord } from './landing-record.entity';
import { LandingRecordController } from './landing-record.controller';
import { LandingRecordService } from './landing-record.service';
import { LandingCatch } from '../landing-catch/landing-catch.entity';
import { FishingTrip } from '../fishing-trip/fishing-trip.entity';
import { Vessel } from '../vessel/vessel.entity';
import { VesselOwner } from '../vessel-owner/vessel-owner.entity';
import { VesselCrew } from '../vessel-crew/vessel-crew.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LandingRecord,
      LandingCatch,
      FishingTrip,
      Vessel,
      VesselOwner,
      VesselCrew,
    ]),
  ],
  controllers: [LandingRecordController],
  providers: [LandingRecordService],
  exports: [LandingRecordService],
})
export class LandingRecordModule {}
