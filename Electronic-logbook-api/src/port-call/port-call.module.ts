import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PortCall } from './port-call.entity';
import { PortCallController } from './port-call.controller';
import { PortCallService } from './port-call.service';
import { FishingTrip } from '../fishing-trip/fishing-trip.entity';
import { Vessel } from '../vessel/vessel.entity';
import { VesselOwner } from '../vessel-owner/vessel-owner.entity';
import { VesselCrew } from '../vessel-crew/vessel-crew.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PortCall,
      FishingTrip,
      Vessel,
      VesselOwner,
      VesselCrew,
    ]),
  ],
  controllers: [PortCallController],
  providers: [PortCallService],
  exports: [PortCallService],
})
export class PortCallModule {}
