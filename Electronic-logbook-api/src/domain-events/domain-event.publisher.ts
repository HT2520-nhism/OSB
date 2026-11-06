/**
 * PHASE 7 — Event Publisher abstraction.
 *
 * Implementations of this interface may publish events to a broker
 * (Kafka/RabbitMQ/etc.) or to a local subscriber set. Business
 * services MUST depend on this abstraction, not on a concrete broker.
 */

import { DomainEventEnvelope } from './domain-event.envelope';

export const DOMAIN_EVENT_PUBLISHER = Symbol.for(
  'PHASE7_DOMAIN_EVENT_PUBLISHER',
);

export interface DomainEventPublisher {
  /**
   * Publish a domain event.
   *
   * MUST throw if delivery fails (transient or permanent).
   * MUST NOT throw for "already delivered by another worker" — i.e.
   * an idempotent re-publish is not an error.
   */
  publish(event: DomainEventEnvelope): Promise<void>;
}
