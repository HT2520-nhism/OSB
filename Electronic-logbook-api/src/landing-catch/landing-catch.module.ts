import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LandingCatch } from './landing-catch.entity';
import { LandingCatchController } from './landing-catch.controller';
import { LandingCatchService } from './landing-catch.service';
import { LandingRecord } from '../landing-record/landing-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LandingCatch, LandingRecord])],
  controllers: [LandingCatchController],
  providers: [LandingCatchService],
  exports: [LandingCatchService],
})
export class LandingCatchModule {}
