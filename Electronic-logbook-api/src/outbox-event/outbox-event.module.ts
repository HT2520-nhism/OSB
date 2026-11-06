import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OutboxEvent } from './outbox-event.entity';
import { OutboxEventService } from './outbox-event.service';

/**
 * Internal module — KHÔNG expose HTTP endpoints.
 * Worker/process khác sẽ inject OutboxEventService để xử lý event.
 */
@Module({
  imports: [TypeOrmModule.forFeature([OutboxEvent])],
  providers: [OutboxEventService],
  exports: [OutboxEventService],
})
export class OutboxEventModule {}
