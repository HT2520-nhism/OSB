import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FuelRecord } from './fuel-record.entity';
import { FuelRecordController } from './fuel-record.controller';
import { FuelRecordService } from './fuel-record.service';
import { FishingTrip } from '../fishing-trip/fishing-trip.entity';
import { Vessel } from '../vessel/vessel.entity';
import { VesselOwner } from '../vessel-owner/vessel-owner.entity';
import { VesselCrew } from '../vessel-crew/vessel-crew.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FuelRecord,
      FishingTrip,
      Vessel,
      VesselOwner,
      VesselCrew,
    ]),
  ],
  controllers: [FuelRecordController],
  providers: [FuelRecordService],
  exports: [FuelRecordService],
})
export class FuelRecordModule {}
