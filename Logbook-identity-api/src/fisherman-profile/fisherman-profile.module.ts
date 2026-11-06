import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FishermanProfileEntity } from './fisherman-profile.entity';
import { AccountEntity } from '../account/account.entity';
import { FishermanProfileService } from './fisherman-profile.service';
import { FishermanProfileController } from './fisherman-profile.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FishermanProfileEntity, AccountEntity])],
  controllers: [FishermanProfileController],
  providers: [FishermanProfileService],
  exports: [FishermanProfileService],
})
export class FishermanProfileModule {}
