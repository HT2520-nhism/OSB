/**
 * PHASE 8 — Incident Service authorization tests.
 */

import { NotFoundException } from '@nestjs/common';
import { IncidentService } from './incident.service';
import type { AuthUser } from '../auth/current-user.decorator';

const ownerA: AuthUser = { accountId: 'user-A' };

interface FakeQueryBuilder {
  alias: string;
  params: Record<string, unknown>;
  select: () => FakeQueryBuilder;
  where: (_clause: string, params: Record<string, unknown>) => FakeQueryBuilder;
  andWhere: (
    _clause: string,
    params: Record<string, unknown>,
  ) => FakeQueryBuilder;
  orderBy: () => FakeQueryBuilder;
  getMany: () => Promise<Array<Record<string, unknown>>>;
  getRawMany: () => Promise<Array<Record<string, unknown>>>;
}

class FakeRepo {
  public data: Array<Record<string, unknown>> = [];
  public nextResult: unknown = undefined;
  public nextRawManyResult: Array<Record<string, unknown>> = [];
  public selectFields: string[] | null = null;

  createQueryBuilder(alias: string): FakeQueryBuilder {
    const builder: FakeQueryBuilder = {
      alias,
      params: {},
      select: () => builder,
      where: (_clause: string, params: Record<string, unknown>) => {
        Object.assign(builder.params, params);
        return builder;
      },
      andWhere: (_clause: string, params: Record<string, unknown>) => {
        Object.assign(builder.params, params);
        return builder;
      },
      orderBy: () => builder,
      getMany: async () => {
        const p = builder.params;
        if (p['vesselIds'] && Array.isArray(p['vesselIds'])) {
          const vesselList = p['vesselIds'] as string[];
          return this.data.filter((d) => {
            if (p['userId'] && d['ownerId'] === p['userId']) return true;
            return vesselList.includes(d['vesselId'] as string);
          });
        }
        return [];
      },
      getRawMany: async () => this.nextRawManyResult,
    };
    return builder;
  }

  async findOne({
    where,
    select,
  }: {
    where: Record<string, unknown>;
    select?: string[];
  }): Promise<Record<string, unknown> | null> {
    this.selectFields = select ?? null;
    if (this.nextResult !== undefined)
      return this.nextResult as Record<string, unknown>;
    return (
      this.data.find((d) => {
        return Object.entries(where).every(([k, v]) => d[k] === v);
      }) ?? null
    );
  }

  async save(entity: Record<string, unknown>) {
    const stored = { ...entity, id: entity.id ?? crypto.randomUUID() };
    this.data.push(stored);
    return stored;
  }

  create(_e: unknown, data: Record<string, unknown>) {
    return { ...data, id: data.id ?? crypto.randomUUID() };
  }
}

class FakeServiceLogger {
  log = (..._args: unknown[]) => undefined;
  warn = (..._args: unknown[]) => undefined;
  error = (..._args: unknown[]) => undefined;
}

describe('IncidentService - user-scoped visibility', () => {
  let service: IncidentService;
  let repository: FakeRepo;
  let vesselRepo: FakeRepo;
  let vesselOwnerRepo: FakeRepo;
  let vesselCrewRepo: FakeRepo;
  let tripRepo: FakeRepo;

  beforeEach(() => {
    repository = new FakeRepo();
    vesselRepo = new FakeRepo();
    vesselOwnerRepo = new FakeRepo();
    vesselCrewRepo = new FakeRepo();
    tripRepo = new FakeRepo();

    // ownerA owns vessel-1; return raw result from vesselRepo
    vesselRepo.nextRawManyResult = [{ vesselId: 'vessel-1' }];
    vesselOwnerRepo.nextRawManyResult = [];
    vesselCrewRepo.nextRawManyResult = [];

    service = new IncidentService(
      repository as never,
      vesselRepo as never,
      vesselOwnerRepo as never,
      vesselCrewRepo as never,
      tripRepo as never,
    );

    (service as unknown as { logger: unknown }).logger =
      new FakeServiceLogger();
  });

  describe('findAll', () => {
    it('returns empty array when no user', async () => {
      const result = await service.findAll();
      expect(result).toEqual([]);
    });

    it('returns empty array when user has no accessible vessels', async () => {
      vesselRepo.nextRawManyResult = [];
      vesselOwnerRepo.nextRawManyResult = [];
      vesselCrewRepo.nextRawManyResult = [];
      const result = await service.findAll({ accountId: 'user-orphan' });
      expect(result).toEqual([]);
    });

    it('returns incidents for vessels owned by user', async () => {
      repository.data = [
        { id: 'i-1', vesselId: 'vessel-1', ownerId: 'user-A' },
        { id: 'i-2', vesselId: 'vessel-2', ownerId: 'user-B' },
      ];

      const result = await service.findAll(ownerA);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('i-1');
    });
  });

  describe('findOne', () => {
    it('allows direct owner to view incident', async () => {
      repository.nextResult = {
        id: 'i-1',
        vesselId: 'vessel-1',
        ownerId: 'user-A',
      };
      const result = await service.findOne('i-1', ownerA);
      expect(result).toBeTruthy();
      expect(result?.id).toBe('i-1');
    });

    it('returns NotFound for users with no access (hides existence)', async () => {
      // user-A owns vessel-1 only, but incident belongs to vessel-2
      repository.nextResult = {
        id: 'i-2',
        vesselId: 'vessel-2',
        ownerId: 'user-B',
      };
      await expect(service.findOne('i-2', ownerA)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException if incident does not exist', async () => {
      repository.nextResult = null;
      await expect(service.findOne('nope', ownerA)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
