/**
 * PHASE 7 — Logging Domain Event Publisher.
 *
 * Default implementation: logs the event envelope through the
 * project's Pino-based logger. This is the right behavior for
 * early-phase environments where no message broker exists yet.
 *
 * Once a broker is introduced, replace this implementation with a
 * `BrokerDomainEventPublisher` and bind it via the same token.
 */

import { Injectable, Logger } from '@nestjs/common';

import { DomainEventEnvelope } from './domain-event.envelope';
import { DomainEventPublisher } from './domain-event.publisher';

@Injectable()
export class LoggingDomainEventPublisher implements DomainEventPublisher {
  /* istanbul ignore next */
  private readonly logger = new Logger('LoggingDomainEventPublisher');

  async publish(event: DomainEventEnvelope): Promise<void> {
    this.logger.log({
      event: 'domain-event.publish',
      eventId: event.eventId,
      eventType: event.eventType,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      correlationId: event.correlationId ?? null,
      causationId: event.causationId ?? null,
      version: event.version,
      occurredAt: event.occurredAt,
    });
  }
}
