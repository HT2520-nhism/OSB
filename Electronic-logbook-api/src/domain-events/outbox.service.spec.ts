/**
 * PHASE 7 — Outbox Service unit tests (transactionality + envelope).
 */

import { OutboxService } from './outbox.service';
import { OutboxStatus } from './domain-event.envelope';

class FakeManager {
  constructor(private readonly repo: FakeRepo) {}
  create(_e: unknown, value: Record<string, unknown>) {
    const id = (value.id as string) ?? crypto.randomUUID();
    const stored = { ...value, id };
    this.repo.events.push(stored);
    return stored;
  }
  async save(_e?: unknown, value?: Record<string, unknown>) {
    // OutboxService.record calls save(entity) with a single arg.
    if (value !== undefined) return value;
    if (_e !== undefined && typeof _e === 'object') return _e;
    return undefined;
  }
  getRepository() {
    return this.repo;
  }
}

class FakeRepo {
  public events: Array<Record<string, unknown>> = [];
  create(_e: unknown, data: Record<string, unknown>) {
    return { ...data, id: data.id ?? crypto.randomUUID() };
  }
  async save(value: Record<string, unknown>) {
    const id = (value.id as string) ?? crypto.randomUUID();
    const stored = { ...value, id };
    this.events.push(stored);
    return stored;
  }
  async find() {
    return [];
  }
  async findBy(opts: { id?: unknown }) {
    const ids = Array.isArray(opts.id) ? (opts.id as string[]) : [];
    return this.events.filter((e) => ids.includes(e.id as string));
  }
  async findOne(opts: { where: { id: string } }) {
    return this.events.find((e) => e.id === opts.where.id) ?? null;
  }
  createQueryBuilder() {
    return {
      where() {
        return this;
      },
      andWhere() {
        return this;
      },
      orderBy() {
        return this;
      },
      limit() {
        return this;
      },
      setLock() {
        return this;
      },
      setOnLocked() {
        return this;
      },
      async getMany() {
        return [];
      },
      update() {
        return this;
      },
      set() {
        return this;
      },
      whereInIds() {
        return this;
      },
      async execute() {
        return { affected: 0 };
      },
    } as never;
  }
  async count() {
    return this.events.length;
  }
}

class FakeQueryRunner {
  async connect() {}
  async startTransaction() {}
  async commitTransaction() {}
  async rollbackTransaction() {}
  async release() {}
}

class FakeDataSource {
  queryRunner = new FakeQueryRunner();
  async transaction<T>(work: (manager: FakeManager) => Promise<T>): Promise<T> {
    const manager = new FakeManager(this.repo as never);
    return work(manager);
  }
  constructor(public readonly repo: FakeRepo) {}
}

function buildService() {
  const repo = new FakeRepo();
  const dataSource = new FakeDataSource(repo);
  const svc = new OutboxService(repo as never, dataSource as never);
  return { svc, repo, dataSource };
}

describe('OutboxService', () => {
  it('records an event inside a transaction', async () => {
    const { svc, repo } = buildService();
    const manager = new FakeManager(repo);
    await svc.record(manager as never, {
      eventType: 'FishingTripCreated',
      aggregateType: 'FishingTrip',
      aggregateId: 'trip-1',
      payload: { hello: 'world' },
      actor: { userId: 'user-1' },
    });
    expect(repo.events.length).toBe(1);
    expect(repo.events[0].status).toBe(OutboxStatus.PENDING);
    const envelope = svc.toEnvelope(repo.events[0] as never);
    expect(envelope.eventType).toBe('FishingTripCreated');
    expect(envelope.actor).toEqual({ userId: 'user-1' });
    expect(envelope.payload).toEqual({ hello: 'world' });
  });

  it('marks event published', async () => {
    const { svc, repo } = buildService();
    const manager = new FakeManager(repo);
    const saved = await svc.record(manager as never, {
      eventType: 'FishingTripCreated',
      aggregateType: 'FishingTrip',
      aggregateId: 'trip-1',
      payload: {},
    });
    const id = (saved as { id: string }).id;
    const marked = await svc.markPublished(id);
    expect(marked.status).toBe(OutboxStatus.PUBLISHED);
    expect(marked.publishedAt).toBeInstanceOf(Date);
  });

  it('records failure and increments retry count', async () => {
    const { svc, repo } = buildService();
    const manager = new FakeManager(repo);
    const saved = await svc.record(manager as never, {
      eventType: 'FishingTripCreated',
      aggregateType: 'FishingTrip',
      aggregateId: 'trip-1',
      payload: {},
    });
    const id = (saved as { id: string }).id;
    const next = new Date();
    const updated = await svc.recordFailure(id, 'broker-down', next, 3);
    expect(updated.retryCount).toBe(1);
    expect(updated.lastError).toBe('broker-down');
    expect(updated.status).toBe(OutboxStatus.PENDING);
    expect(updated.availableAt).toBe(next);

    const updated2 = await svc.recordFailure(id, 'x', next, 1);
    expect(updated2.status).toBe(OutboxStatus.PERMANENTLY_FAILED);
  });

  it('hides __actor from the published envelope', async () => {
    const { svc, repo } = buildService();
    const manager = new FakeManager(repo);
    const saved = await svc.record(manager as never, {
      eventType: 'FishingTripCreated',
      aggregateType: 'FishingTrip',
      aggregateId: 'trip-1',
      payload: { tripId: 't1' },
      actor: { userId: 'u1', deviceId: 'd1' },
    });
    const env = svc.toEnvelope(saved as never);
    expect(env.actor).toEqual({ userId: 'u1', deviceId: 'd1' });
    expect(env.payload).toEqual({ tripId: 't1' });
    expect('__actor' in env.payload).toBe(false);
  });

  it('claimBatch runs inside a transaction (pessimistic lock requires it)', async () => {
    const { svc, repo, dataSource } = buildService();
    // Pre-populate pending event.
    const manager = new FakeManager(repo);
    const saved = await svc.record(manager as never, {
      eventType: 'FishingTripCreated',
      aggregateType: 'FishingTrip',
      aggregateId: 'trip-1',
      payload: {},
    });
    expect(saved.status).toBe(OutboxStatus.PENDING);

    const transactionSpy = jest.spyOn(dataSource, 'transaction');
    const claimed = await svc.claimBatch('worker-1', 10);

    expect(transactionSpy).toHaveBeenCalledTimes(1);
    expect(claimed.length).toBeGreaterThanOrEqual(0);
  });
});
