/**
 * PHASE 7 — Outbox Service.
 *
 * Single API surface for:
 *  - Creating an outbox event inside a DB transaction (mandatory).
 *  - Claiming events with FOR UPDATE SKIP LOCKED for safe concurrency.
 *  - Marking events as PUBLISHED.
 *  - Recording failures and scheduling retries.
 *
 * Business services MUST use this service through OutboxRecorder so
 * that an event can never be persisted without a manager context.
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  DataSource,
  EntityManager,
  In,
  LessThanOrEqual,
  Repository,
} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';

import { OutboxEvent } from '../outbox-event/outbox-event.entity';
import {
  DOMAIN_EVENT_VERSION,
  DomainEventEnvelope,
  OutboxStatus,
} from './domain-event.envelope';

export interface RecordEventInput {
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  occurredAt?: string;
  actor?: { userId?: string; deviceId?: string };
  correlationId?: string | null;
  causationId?: string | null;
  /** Override for the event_version (defaults to DOMAIN_EVENT_VERSION). */
  eventVersion?: number;
  /** When the publisher should be allowed to attempt delivery. */
  availableAt?: Date;
}

@Injectable()
export class OutboxService {
  /* istanbul ignore next */
  private readonly logger = new Logger('OutboxService');

  constructor(
    @InjectRepository(OutboxEvent)
    private readonly repository: Repository<OutboxEvent>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Persist a new event with the supplied EntityManager.
   *
   * IMPORTANT: This must be called inside the same transaction that
   * performs the business mutation. The OutboxEventService exposes a
   * non-transactional fallback for backwards compatibility with the
   * existing Phase 6 sync tests but business code MUST use `record`.
   */
  async record(
    manager: EntityManager,
    input: RecordEventInput,
  ): Promise<OutboxEvent> {
    const eventId = crypto.randomUUID();
    const enrichedPayload: Record<string, unknown> = {
      ...input.payload,
      __actor: input.actor ?? null,
    };
    const entity = manager.create(OutboxEvent, {
      eventId,
      eventType: input.eventType,
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      payload: enrichedPayload,
      status: OutboxStatus.PENDING,
      retryCount: 0,
      availableAt: input.availableAt ?? new Date(),
      publishedAt: null,
      correlationId: input.correlationId ?? null,
      causationId: input.causationId ?? null,
      eventVersion: input.eventVersion ?? DOMAIN_EVENT_VERSION,
      claimedBy: null,
      claimedAt: null,
      lastError: null,
      lastErrorAt: null,
    });
    const saved = await manager.save(entity);
    this.logger.log({
      event: 'outbox.recorded',
      eventId,
      eventType: input.eventType,
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      correlationId: input.correlationId ?? null,
    });
    return saved;
  }

  /**
   * Build the canonical envelope from a recorded event row.
   * The actor (if any) is reconstructed from `__actor` in the payload
   * to avoid widening the DB schema.
   */
  toEnvelope(event: OutboxEvent): DomainEventEnvelope {
    const payload = event.payload ?? {};
    const actorFromPayload = (payload as Record<string, unknown>).__actor as
      | { userId?: string; deviceId?: string }
      | undefined
      | null;
    // Remove the internal __actor key before exposing.
    const publicPayload = { ...payload } as Record<string, unknown>;
    delete publicPayload['__actor'];
    return {
      eventId: event.eventId,
      eventType: event.eventType ?? 'Unknown',
      aggregateType: event.aggregateType ?? 'Unknown',
      aggregateId: event.aggregateId ?? '',
      occurredAt: event.createdAt?.toISOString?.() ?? new Date().toISOString(),
      actor: actorFromPayload ?? undefined,
      correlationId: event.correlationId,
      causationId: event.causationId,
      version: event.eventVersion ?? DOMAIN_EVENT_VERSION,
      payload: publicPayload,
    };
  }

  /**
   * Find pending events that are eligible to be claimed.
   */
  async findEligible(limit: number): Promise<OutboxEvent[]> {
    return this.repository.find({
      where: {
        status: OutboxStatus.PENDING,
        availableAt: LessThanOrEqual(new Date()),
      },
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  /**
   * Atomically claim a batch of pending events.
   *
   * Uses Postgres `FOR UPDATE SKIP LOCKED` semantics inside an explicit
   * TypeORM transaction:
   *  - concurrent workers will not block each other
   *  - locked rows are simply skipped and re-evaluated next poll
   *  - the SELECT + UPDATE share the same transaction so claimed rows
   *    are not visible to other workers until we commit
   *
   * The pessimistic lock requires an active transaction; the earlier
   * implementation called the repository directly, which triggered
   * `PessimisticLockTransactionRequiredError`.
   *
   * @param workerId  unique identifier for the worker (e.g. host:pid)
   * @param limit     maximum number of events to claim
   */
  async claimBatch(workerId: string, limit: number): Promise<OutboxEvent[]> {
    return this.dataSource.transaction(async (manager) => {
      const rows = await manager
        .getRepository(OutboxEvent)
        .createQueryBuilder('event')
        .where('status = :pending', { pending: OutboxStatus.PENDING })
        .andWhere('available_at <= :now', { now: new Date() })
        .orderBy('created_at', 'ASC')
        .limit(limit)
        .setLock('pessimistic_write')
        .setOnLocked('skip_locked')
        .getMany();

      if (rows.length === 0) return [];

      const ids = rows.map((e) => e.id);
      await manager
        .getRepository(OutboxEvent)
        .createQueryBuilder()
        .update()
        .set({
          status: OutboxStatus.IN_FLIGHT,
          claimedBy: workerId,
          claimedAt: new Date(),
        })
        .whereInIds(ids)
        .execute();

      return manager.getRepository(OutboxEvent).findBy({ id: In(ids) });
    });
  }

  async markPublished(id: string): Promise<OutboxEvent> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new Error(`OutboxEvent ${id} not found`);
    }
    entity.status = OutboxStatus.PUBLISHED;
    entity.publishedAt = new Date();
    entity.lastError = null;
    entity.lastErrorAt = null;
    return this.repository.save(entity);
  }

  async recordFailure(
    id: string,
    error: string,
    nextAvailableAt: Date,
    maxRetries: number,
  ): Promise<OutboxEvent> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new Error(`OutboxEvent ${id} not found`);
    }
    entity.retryCount = (entity.retryCount ?? 0) + 1;
    entity.lastError = error;
    entity.lastErrorAt = new Date();
    if (entity.retryCount > maxRetries) {
      entity.status = OutboxStatus.PERMANENTLY_FAILED;
    } else {
      entity.status = OutboxStatus.PENDING;
    }
    entity.availableAt = nextAvailableAt;
    return this.repository.save(entity);
  }

  /**
   * Diagnostic — number of currently-pending events.
   */
  async countPending(): Promise<number> {
    return this.repository.count({
      where: { status: OutboxStatus.PENDING },
    });
  }

  async countFailed(): Promise<number> {
    return this.repository.count({
      where: { status: OutboxStatus.PERMANENTLY_FAILED },
    });
  }
}
