import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FishingGear } from './fishing-gear.entity';
import { FishingGearController } from './fishing-gear.controller';
import { FishingGearService } from './fishing-gear.service';

@Module({
  imports: [TypeOrmModule.forFeature([FishingGear])],
  controllers: [FishingGearController],
  providers: [FishingGearService],
  exports: [FishingGearService],
})
export class FishingGearModule {}
