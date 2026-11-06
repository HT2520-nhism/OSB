import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CatchRecord } from './catch-record.entity';
import { CatchRecordController } from './catch-record.controller';
import { CatchRecordService } from './catch-record.service';
import { FishingOperation } from '../fishing-operation/fishing-operation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CatchRecord, FishingOperation])],
  controllers: [CatchRecordController],
  providers: [CatchRecordService],
  exports: [CatchRecordService],
})
export class CatchRecordModule {}
