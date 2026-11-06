/**
 * PHASE 8 — VesselOwner & VesselCrew Service authorization tests.
 */

import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { VesselOwnerService } from './vessel-owner.service';
import { VesselCrewService } from '../vessel-crew/vessel-crew.service';
import type { AuthUser } from '../auth/current-user.decorator';

const userA: AuthUser = { accountId: 'user-A' };

class FakeRepo {
  public data: Array<Record<string, unknown>> = [];
  public nextResult: unknown = undefined;
  public nextRawManyResult: Array<Record<string, unknown>> = [];

  createQueryBuilder(_alias: string) {
    const builder: Record<string, unknown> = {
      params: {} as Record<string, unknown>,
    };
    builder.select = () => builder;
    builder.leftJoinAndSelect = () => builder;
    builder.where = (_clause: string, params: Record<string, unknown>) => {
      Object.assign(builder.params as object, params);
      return builder;
    };
    builder.andWhere = (_clause: string, params: Record<string, unknown>) => {
      Object.assign(builder.params as object, params);
      return builder;
    };
    builder.orderBy = () => builder;
    builder.getMany = async () => {
      const p = builder.params as Record<string, unknown>;
      if (p['vesselIds'] && Array.isArray(p['vesselIds'])) {
        const vesselList = p['vesselIds'] as string[];
        return this.data.filter((d) =>
          vesselList.includes(d['vesselId'] as string),
        );
      }
      return [];
    };
    builder.getRawMany = async () => this.nextRawManyResult;
    return builder;
  }

  async find({
    where,
  }: {
    where: Record<string, unknown>;
  }): Promise<Array<Record<string, unknown>>> {
    return this.data.filter((d) => {
      return Object.entries(where).every(([k, v]) => d[k] === v);
    });
  }

  async findOne({
    where,
    relations,
  }: {
    where: Record<string, unknown>;
    relations?: string[];
  }): Promise<Record<string, unknown> | null> {
    if (this.nextResult !== undefined)
      return this.nextResult as Record<string, unknown>;
    void relations;
    return (
      this.data.find((d) => {
        return Object.entries(where).every(([k, v]) => d[k] === v);
      }) ?? null
    );
  }

  async save(entity: Record<string, unknown>) {
    const stored = {
      ...entity,
      id: (entity.id as string) ?? crypto.randomUUID(),
    };
    this.data.push(stored);
    return stored;
  }

  create(data?: Record<string, unknown>) {
    const safe = (data ?? {}) as Record<string, unknown>;
    return { ...safe, id: (safe.id as string) ?? crypto.randomUUID() };
  }

  async update(id: string, data: Record<string, unknown>) {
    const idx = this.data.findIndex((d) => d.id === id);
    if (idx >= 0) this.data[idx] = { ...this.data[idx], ...data };
  }

  async delete(id: string) {
    const idx = this.data.findIndex((d) => d.id === id);
    if (idx >= 0) this.data.splice(idx, 1);
  }
}

class FakeServiceLogger {
  log = (..._args: unknown[]) => undefined;
  warn = (..._args: unknown[]) => undefined;
  error = (..._args: unknown[]) => undefined;
}

function makeService<T>(
  ServiceCtor: new (...args: never[]) => T,
  ownerRepo: FakeRepo,
  vesselRepo: FakeRepo,
): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = new ServiceCtor(ownerRepo as never, vesselRepo as never);
  (svc as unknown as { logger: unknown }).logger = new FakeServiceLogger();
  return svc;
}

describe('VesselOwnerService - user-scoped visibility', () => {
  let service: VesselOwnerService;
  let vesselOwnerRepo: FakeRepo;
  let vesselRepo: FakeRepo;

  beforeEach(() => {
    vesselOwnerRepo = new FakeRepo();
    vesselRepo = new FakeRepo();
    // user-A owns vessel-1
    vesselRepo.nextRawManyResult = [{ vesselId: 'vessel-1' }];
    vesselOwnerRepo.nextRawManyResult = [];

    vesselOwnerRepo.data = [
      { id: 'vo-1', vesselId: 'vessel-1', userId: 'user-A', isCurrent: true },
      { id: 'vo-2', vesselId: 'vessel-2', userId: 'user-B', isCurrent: true },
    ];

    service = makeService(VesselOwnerService, vesselOwnerRepo, vesselRepo);
  });

  describe('findAll', () => {
    it('returns empty when no user', async () => {
      const result = await service.findAll();
      expect(result).toEqual([]);
    });

    it('returns only owners for accessible vessels', async () => {
      const result = await service.findAll(userA);
      // user-A has access to vessel-1, so only vo-1 is returned
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('vo-1');
    });

    it('returns empty when user has no accessible vessels', async () => {
      vesselRepo.nextRawManyResult = [];
      vesselOwnerRepo.nextRawManyResult = [];
      const orphan: AuthUser = { accountId: 'orphan' };
      const result = await service.findAll(orphan);
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('allows access to owners of accessible vessels', async () => {
      vesselOwnerRepo.nextResult = {
        id: 'vo-1',
        vesselId: 'vessel-1',
        userId: 'user-A',
      };
      const result = await service.findOne('vo-1', userA);
      expect(result.id).toBe('vo-1');
    });

    it('returns NotFound for owners of inaccessible vessels', async () => {
      vesselOwnerRepo.nextResult = {
        id: 'vo-2',
        vesselId: 'vessel-2',
        userId: 'user-B',
      };
      await expect(service.findOne('vo-2', userA)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFound if not exists', async () => {
      vesselOwnerRepo.nextResult = null;
      await expect(service.findOne('nope', userA)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('allows creation for accessible vessel', async () => {
      const result = await service.create(
        { vesselId: 'vessel-1', userId: 'user-X' } as never,
        userA,
      );
      expect(result.vesselId).toBe('vessel-1');
    });

    it('throws Forbidden for inaccessible vessel', async () => {
      await expect(
        service.create(
          { vesselId: 'vessel-99', userId: 'user-X' } as never,
          userA,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws Forbidden when user missing', async () => {
      const noUser = { accountId: '' } as AuthUser;
      await expect(
        service.create({ vesselId: 'vessel-1' } as never, noUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});

describe('VesselCrewService - user-scoped visibility', () => {
  let service: VesselCrewService;
  let vesselCrewRepo: FakeRepo;
  let vesselRepo: FakeRepo;

  beforeEach(() => {
    vesselCrewRepo = new FakeRepo();
    vesselRepo = new FakeRepo();
    vesselRepo.nextRawManyResult = [{ vesselId: 'vessel-1' }];

    vesselCrewRepo.data = [
      {
        id: 'vc-1',
        vesselId: 'vessel-1',
        userId: 'user-Crew1',
        isActive: true,
      },
      {
        id: 'vc-2',
        vesselId: 'vessel-2',
        userId: 'user-Crew2',
        isActive: true,
      },
    ];

    service = makeService(VesselCrewService, vesselCrewRepo, vesselRepo);
  });

  describe('findAll', () => {
    it('returns empty when no user', async () => {
      const result = await service.findAll();
      expect(result).toEqual([]);
    });

    it('returns only crew for accessible vessels', async () => {
      const result = await service.findAll(userA);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('vc-1');
    });
  });

  describe('findOne', () => {
    it('allows access to crew of accessible vessels', async () => {
      vesselCrewRepo.nextResult = {
        id: 'vc-1',
        vesselId: 'vessel-1',
        userId: 'user-Crew1',
      };
      const result = await service.findOne('vc-1', userA);
      expect(result.id).toBe('vc-1');
    });

    it('returns NotFound for crew of inaccessible vessels', async () => {
      vesselCrewRepo.nextResult = {
        id: 'vc-2',
        vesselId: 'vessel-2',
        userId: 'user-Crew2',
      };
      await expect(service.findOne('vc-2', userA)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('allows creation for accessible vessel', async () => {
      const result = await service.create(
        {
          vesselId: 'vessel-1',
          userId: 'user-Crew3',
          role: 'deckhand',
        } as never,
        userA,
      );
      expect(result.vesselId).toBe('vessel-1');
    });

    it('throws Forbidden for inaccessible vessel', async () => {
      await expect(
        service.create({ vesselId: 'vessel-99' } as never, userA),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
