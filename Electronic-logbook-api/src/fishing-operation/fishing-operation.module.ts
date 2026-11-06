import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FishingOperation } from './fishing-operation.entity';
import { FishingOperationController } from './fishing-operation.controller';
import { FishingOperationService } from './fishing-operation.service';
import { FishingTrip } from '../fishing-trip/fishing-trip.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FishingOperation, FishingTrip])],
  controllers: [FishingOperationController],
  providers: [FishingOperationService],
  exports: [FishingOperationService],
})
export class FishingOperationModule {}
