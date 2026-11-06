import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FishingTripGear } from './fishing-trip-gear.entity';
import { FishingTripGearController } from './fishing-trip-gear.controller';
import { FishingTripGearService } from './fishing-trip-gear.service';
import { FishingTrip } from '../fishing-trip/fishing-trip.entity';
import { FishingGear } from '../fishing-gear/fishing-gear.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([FishingTripGear, FishingTrip, FishingGear]),
  ],
  controllers: [FishingTripGearController],
  providers: [FishingTripGearService],
  exports: [FishingTripGearService],
})
export class FishingTripGearModule {}
