import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FishingTripCrew } from './fishing-trip-crew.entity';
import { FishingTripCrewController } from './fishing-trip-crew.controller';
import { FishingTripCrewService } from './fishing-trip-crew.service';
import { FishingTrip } from '../fishing-trip/fishing-trip.entity';
import { FishingOperationProfileModule } from '../fishing-operation-profile/fishing-operation-profile.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FishingTripCrew, FishingTrip]),
    FishingOperationProfileModule,
    AuthModule,
  ],
  controllers: [FishingTripCrewController],
  providers: [FishingTripCrewService],
  exports: [FishingTripCrewService],
})
export class FishingTripCrewModule {}
