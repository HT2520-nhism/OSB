import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { VesselOwner } from './vessel-owner.entity';
import { Vessel } from '../vessel/vessel.entity';
import { VesselOwnerController } from './vessel-owner.controller';
import { VesselOwnerService } from './vessel-owner.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([VesselOwner, Vessel]), AuthModule],
  controllers: [VesselOwnerController],
  providers: [VesselOwnerService],
  exports: [VesselOwnerService],
})
export class VesselOwnerModule {}
