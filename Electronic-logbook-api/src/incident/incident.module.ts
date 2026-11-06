import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Incident } from './incident.entity';
import { IncidentController } from './incident.controller';
import { IncidentService } from './incident.service';
import { Vessel } from '../vessel/vessel.entity';
import { VesselOwner } from '../vessel-owner/vessel-owner.entity';
import { VesselCrew } from '../vessel-crew/vessel-crew.entity';
import { FishingTrip } from '../fishing-trip/fishing-trip.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Incident,
      Vessel,
      VesselOwner,
      VesselCrew,
      FishingTrip,
    ]),
  ],
  controllers: [IncidentController],
  providers: [IncidentService],
  exports: [IncidentService],
})
export class IncidentModule {}
