/**
 * PHASE 8 — Fishing Operation Profile Module.
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FishingOperationProfile } from './fishing-operation-profile.entity';
import { FishingOperationProfileService } from './fishing-operation-profile.service';
import { FishingOperationProfileController } from './fishing-operation-profile.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FishingOperationProfile])],
  controllers: [FishingOperationProfileController],
  providers: [FishingOperationProfileService],
  exports: [FishingOperationProfileService],
})
export class FishingOperationProfileModule {}
