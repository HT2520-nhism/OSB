import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SyncOperation } from './sync-operation.entity';
import { SyncOperationController } from './sync-operation.controller';
import { SyncOperationService } from './sync-operation.service';

@Module({
  imports: [TypeOrmModule.forFeature([SyncOperation])],
  controllers: [SyncOperationController],
  providers: [SyncOperationService],
  exports: [SyncOperationService],
})
export class SyncOperationModule {}
