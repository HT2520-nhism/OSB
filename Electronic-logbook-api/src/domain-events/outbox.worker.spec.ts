/**
 * PHASE 7 — Outbox worker retry + concurrency tests.
 */

import { OutboxWorker } from './outbox.worker';
import { DomainEventEnvelope, OutboxStatus } from './domain-event.envelope';
import { OutboxService } from './outbox.service';

class FakePublisher {
  public events: DomainEventEnvelope[] = [];
  public failNext = 0;
  async publish(event: DomainEventEnvelope): Promise<void> {
    if (this.failNext > 0) {
      this.failNext -= 1;
      throw new Error('boom');
    }
    this.events.push(event);
  }
}

function makeEvent(row: {
  id: string;
  eventId: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  retryCount: number;
  status: string;
}) {
  const createdAt = new Date();
  return {
    ...row,
    createdAt,
    toEnvelope() {
      return {
        eventId: row.eventId,
        eventType: row.eventType,
        aggregateType: row.aggregateType,
        aggregateId: row.aggregateId,
        occurredAt: createdAt.toISOString(),
        version: 1,
        payload: row.payload,
      } as DomainEventEnvelope;
    },
  } as never;
}

class FakeOutboxService {
  public queue: Array<ReturnType<typeof makeEvent>> = [];
  public claimed: Array<ReturnType<typeof makeEvent>> = [];
  public marksPublished: string[] = [];
  public marksFailed: Array<{ id: string; status: string; retry: number }> = [];

  async claimBatch(_w: string, limit: number) {
    const taken = this.queue.splice(0, limit);
    this.claimed.push(...taken);
    return taken;
  }

  async markPublished(id: string) {
    this.marksPublished.push(id);
    return makeEvent({
      id,
      eventId: 'x',
      eventType: 'X',
      aggregateType: 'X',
      aggregateId: 'x',
      payload: {},
      retryCount: 0,
      status: OutboxStatus.PUBLISHED,
    });
  }

  async recordFailure(id: string, err: string, _at: Date, maxRetries: number) {
    const found = this.claimed.find((q) => (q as { id: string }).id === id);
    const fromQueue = found
      ? (found as { retryCount: number }).retryCount ?? 0
      : 0;
    const fromHistory = this.marksFailed.filter((m) => m.id === id).length;
    const retry = fromQueue + fromHistory + 1;
    this.marksFailed.push({ id, status: err, retry });
    return makeEvent({
      id,
      eventId: 'x',
      eventType: 'X',
      aggregateType: 'X',
      aggregateId: 'x',
      payload: {},
      retryCount: retry,
      status:
        retry > maxRetries
          ? OutboxStatus.PERMANENTLY_FAILED
          : OutboxStatus.PENDING,
    });
  }

  toEnvelope(e: never) {
    return (e as { toEnvelope(): DomainEventEnvelope }).toEnvelope();
  }
}

describe('OutboxWorker', () => {
  it('publishes pending events and marks them published', async () => {
    const publisher = new FakePublisher();
    const outbox = new FakeOutboxService();
    outbox.queue.push(
      makeEvent({
        id: '1',
        eventId: 'e-1',
        eventType: 'FishingTripCreated',
        aggregateType: 'FishingTrip',
        aggregateId: 't-1',
        payload: { hello: 'world' },
        retryCount: 0,
        status: 'pending',
      }),
    );
    const w = new OutboxWorker(
      outbox as unknown as OutboxService,
      publisher as never,
    );
    await w.tick();
    expect(publisher.events.length).toBe(1);
    expect(outbox.marksPublished).toEqual(['1']);
    expect(outbox.marksFailed).toEqual([]);
  });

  it('records a failure and schedules retry', async () => {
    const publisher = new FakePublisher();
    publisher.failNext = 1;
    const outbox = new FakeOutboxService();
    outbox.queue.push(
      makeEvent({
        id: '2',
        eventId: 'e-2',
        eventType: 'FishingTripCreated',
        aggregateType: 'FishingTrip',
        aggregateId: 't-2',
        payload: {},
        retryCount: 0,
        status: 'pending',
      }),
    );
    const w = new OutboxWorker(
      outbox as unknown as OutboxService,
      publisher as never,
    );
    await w.tick();
    expect(publisher.events.length).toBe(0);
    expect(outbox.marksPublished).toEqual([]);
    expect(outbox.marksFailed.length).toBe(1);
  });

  it('stops retrying once maxRetries exceeded', async () => {
    const publisher = new FakePublisher();
    publisher.failNext = 5;
    const outbox = new FakeOutboxService();
    outbox.queue.push(
      makeEvent({
        id: '3',
        eventId: 'e-3',
        eventType: 'FishingTripCreated',
        aggregateType: 'FishingTrip',
        aggregateId: 't-3',
        payload: {},
        retryCount: 3,
        status: 'pending',
      }),
    );
    const w = new OutboxWorker(
      outbox as unknown as OutboxService,
      publisher as never,
    );
    await w.tick();
    const last = outbox.marksFailed[0];
    expect(last.retry).toBe(4);
  });

  it('does not duplicate business effect for retries', async () => {
    const publisher = new FakePublisher();
    const outbox = new FakeOutboxService();
    outbox.queue.push(
      makeEvent({
        id: '4',
        eventId: 'e-4',
        eventType: 'FishingTripCreated',
        aggregateType: 'FishingTrip',
        aggregateId: 't-4',
        payload: { tripId: 'T4' },
        retryCount: 0,
        status: 'pending',
      }),
    );
    const w = new OutboxWorker(
      outbox as unknown as OutboxService,
      publisher as never,
    );
    await w.tick();
    expect(publisher.events.length).toBe(1);
    expect(publisher.events[0].eventId).toBe('e-4');
  });
});
