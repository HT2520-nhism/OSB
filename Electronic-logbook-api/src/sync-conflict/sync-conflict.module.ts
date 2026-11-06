import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SyncConflict } from './sync-conflict.entity';
import { SyncConflictController } from './sync-conflict.controller';
import { SyncConflictService } from './sync-conflict.service';

@Module({
  imports: [TypeOrmModule.forFeature([SyncConflict])],
  controllers: [SyncConflictController],
  providers: [SyncConflictService],
  exports: [SyncConflictService],
})
export class SyncConflictModule {}
