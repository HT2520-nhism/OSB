/**
 * PHASE 7 — Domain Events Module.
 *
 * Wires:
 *  - OutboxService (transactional event recorder)
 *  - DomainEventPublisher (default: LoggingDomainEventPublisher)
 *  - OutboxWorker (background publisher)
 *
 * Note: This module does NOT expose HTTP endpoints. Outbox is internal
 * infrastructure. Phase 5 services inject OutboxService directly.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OutboxEvent } from '../outbox-event/outbox-event.entity';
import { OutboxService } from './outbox.service';
import { OutboxWorker, DOMAIN_EVENT_PUBLISHER_TOKEN } from './outbox.worker';
import { LoggingDomainEventPublisher } from './logging-domain-event.publisher';

@Module({
  imports: [TypeOrmModule.forFeature([OutboxEvent])],
  providers: [
    OutboxService,
    LoggingDomainEventPublisher,
    {
      provide: DOMAIN_EVENT_PUBLISHER_TOKEN,
      useExisting: LoggingDomainEventPublisher,
    },
    OutboxWorker,
  ],
  exports: [OutboxService],
})
export class DomainEventsModule {}
