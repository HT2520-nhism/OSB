import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Vessel } from './vessel.entity';
import { VesselController } from './vessel.controller';
import { VesselService } from './vessel.service';

import { VesselOwner } from '../vessel-owner/vessel-owner.entity';
import { VesselCrew } from '../vessel-crew/vessel-crew.entity';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vessel, VesselOwner, VesselCrew]),
    AuthModule,
  ],
  controllers: [VesselController],
  providers: [VesselService],
  exports: [VesselService],
})
export class VesselModule {}
