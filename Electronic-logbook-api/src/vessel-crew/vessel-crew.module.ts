import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { VesselCrew } from './vessel-crew.entity';
import { Vessel } from '../vessel/vessel.entity';
import { VesselCrewController } from './vessel-crew.controller';
import { VesselCrewService } from './vessel-crew.service';
import { FishingOperationProfileModule } from '../fishing-operation-profile/fishing-operation-profile.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VesselCrew, Vessel]),
    FishingOperationProfileModule,
    AuthModule,
  ],
  controllers: [VesselCrewController],
  providers: [VesselCrewService],
  exports: [VesselCrewService],
})
export class VesselCrewModule {}
