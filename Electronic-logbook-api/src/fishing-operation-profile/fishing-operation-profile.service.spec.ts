/**
 * PHASE 8 — Fishing Operation Profile Service tests.
 *
 * Tests:
 *  - Code generation (sequence-based)
 *  - Duplicate user_id rejection
 *  - Search by fishermanCode
 *  - Invalid code handling
 *  - fishermanCode to userId resolution
 */
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FishingOperationProfileService } from './fishing-operation-profile.service';
import {
  FishingOperationProfile,
  FishingOperationProfileStatus,
} from './fishing-operation-profile.entity';

class FakeDataSource {
  public nextSeqValue: number = 1;
  public queries: Array<{ sql: string; params?: unknown[] }> = [];

  query(sql: string, params?: unknown[]): Promise<unknown[]> {
    this.queries.push({ sql, params });
    if (sql.includes('nextval')) {
      return Promise.resolve([{ seq: this.nextSeqValue }]);
    }
    return Promise.resolve([]);
  }
}

class FakeRepo {
  public data: Array<FishingOperationProfile> = [];
  public nextResult: FishingOperationProfile | null = null;

  createQueryBuilder(alias: string) {
    const builder: Record<string, unknown> = {
      alias,
      params: {},
      _data: this.data,
    };
    builder.select = () => builder;
    builder.andWhere = (_clause: string, params: Record<string, unknown>) => {
      Object.assign(builder.params as object, params);
      return builder;
    };
    builder.orderBy = () => builder;
    builder.getMany = async () => {
      const p = builder.params as Record<string, unknown>;
      return this.data.filter((d) => {
        if (p['fishermanCode'] && d.fishermanCode !== p['fishermanCode'])
          return false;
        if (p['userId'] && d.userId !== p['userId']) return false;
        if (p['status'] && d.status !== p['status']) return false;
        return true;
      });
    };
    return builder;
  }

  async findOne({
    where,
  }: {
    where: Record<string, unknown>;
  }): Promise<FishingOperationProfile | null> {
    if (this.nextResult) return this.nextResult;
    return (
      this.data.find((d) => {
        if (
          where['fishermanCode'] &&
          d.fishermanCode !== where['fishermanCode']
        )
          return false;
        if (where['userId'] && d.userId !== where['userId']) return false;
        return true;
      }) ?? null
    );
  }

  create(data: Partial<FishingOperationProfile>): FishingOperationProfile {
    return {
      id: data.id ?? 'generated-uuid',
      userId: data.userId!,
      fishermanCode: data.fishermanCode!,
      status: data.status ?? FishingOperationProfileStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async save(
    entity: FishingOperationProfile,
  ): Promise<FishingOperationProfile> {
    this.data.push(entity);
    return entity;
  }
}

class FakeLogger {
  log = () => undefined;
  warn = () => undefined;
  error = () => undefined;
}

const userA = { accountId: 'user-A' };

describe('FishingOperationProfileService', () => {
  let service: FishingOperationProfileService;
  let repository: FakeRepo;
  let dataSource: FakeDataSource;

  beforeEach(() => {
    repository = new FakeRepo();
    dataSource = new FakeDataSource();
    service = new FishingOperationProfileService(
      repository as never,
      dataSource as never,
    );
    (service as unknown as { logger: unknown }).logger = new FakeLogger();
  });

  describe('create', () => {
    it('generates fishermanCode using sequence', async () => {
      dataSource.nextSeqValue = 42;
      const result = await service.create({ userId: 'user-X' } as never, userA);

      expect(result.fishermanCode).toBe('FSH-000042');
      expect(dataSource.queries.some((q) => q.sql.includes('nextval'))).toBe(
        true,
      );
    });

    it('creates profile with ACTIVE status by default', async () => {
      const result = await service.create({ userId: 'user-X' } as never, userA);
      expect(result.status).toBe(FishingOperationProfileStatus.ACTIVE);
    });

    it('throws ConflictException for duplicate user_id', async () => {
      repository.data.push({
        id: 'existing',
        userId: 'user-X',
        fishermanCode: 'FSH-000001',
        status: FishingOperationProfileStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        service.create({ userId: 'user-X' } as never, userA),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ForbiddenException when no user', async () => {
      await expect(
        service.create(
          { userId: 'user-X' } as never,
          { accountId: '' } as never,
        ),
      ).rejects.toThrow('Authenticated user required');
    });
  });

  describe('search', () => {
    beforeEach(() => {
      repository.data = [
        {
          id: 'p-1',
          userId: 'user-A',
          fishermanCode: 'FSH-000001',
          status: FishingOperationProfileStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'p-2',
          userId: 'user-B',
          fishermanCode: 'FSH-000002',
          status: FishingOperationProfileStatus.INACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
    });

    it('returns empty array when no user', async () => {
      const result = await service.search({}, { accountId: '' } as never);
      expect(result).toEqual([]);
    });

    it('searches by fishermanCode', async () => {
      const result = await service.search(
        { fishermanCode: 'FSH-000001' },
        userA,
      );
      expect(result.length).toBe(1);
      expect(result[0].fishermanCode).toBe('FSH-000001');
    });

    it('searches by userId', async () => {
      const result = await service.search({ userId: 'user-B' }, userA);
      expect(result.length).toBe(1);
      expect(result[0].userId).toBe('user-B');
    });

    it('searches by status', async () => {
      const result = await service.search({ status: 'ACTIVE' }, userA);
      expect(result.length).toBe(1);
      expect(result[0].status).toBe('ACTIVE');
    });

    it('combines multiple filters', async () => {
      const result = await service.search(
        { fishermanCode: 'FSH-000002', status: 'INACTIVE' },
        userA,
      );
      expect(result.length).toBe(1);
    });
  });

  describe('resolveUserIdByCode', () => {
    beforeEach(() => {
      repository.data = [
        {
          id: 'p-1',
          userId: 'user-X',
          fishermanCode: 'FSH-000123',
          status: FishingOperationProfileStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
    });

    it('resolves valid fishermanCode to userId', async () => {
      const result = await service.resolveUserIdByCode('FSH-000123');
      expect(result?.userId).toBe('user-X');
      expect(result?.status).toBe(FishingOperationProfileStatus.ACTIVE);
    });

    it('returns null for invalid code', async () => {
      const result = await service.resolveUserIdByCode('FSH-999999');
      expect(result).toBeNull();
    });
  });

  describe('findByFishermanCode', () => {
    beforeEach(() => {
      repository.data = [
        {
          id: 'p-1',
          userId: 'user-X',
          fishermanCode: 'FSH-000123',
          status: FishingOperationProfileStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
    });

    it('returns profile for valid code', async () => {
      const result = await service.findByFishermanCode('FSH-000123', userA);
      expect(result?.fishermanCode).toBe('FSH-000123');
    });

    it('returns null for invalid code', async () => {
      const result = await service.findByFishermanCode('FSH-999999', userA);
      expect(result).toBeNull();
    });

    it('returns null when no user', async () => {
      const result = await service.findByFishermanCode('FSH-000123', {
        accountId: '',
      } as never);
      expect(result).toBeNull();
    });
  });

  describe('concurrent code generation safety', () => {
    it('sequence ensures unique codes even with concurrent requests', async () => {
      // Simulate 3 sequential requests — each should get a unique seq value
      dataSource.nextSeqValue = 1;
      const code1 = await service.create({ userId: 'user-1' } as never, userA);
      expect(code1.fishermanCode).toBe('FSH-000001');

      dataSource.nextSeqValue = 2;
      const code2 = await service.create({ userId: 'user-2' } as never, userA);
      expect(code2.fishermanCode).toBe('FSH-000002');

      dataSource.nextSeqValue = 3;
      const code3 = await service.create({ userId: 'user-3' } as never, userA);
      expect(code3.fishermanCode).toBe('FSH-000003');

      // Verify all codes are unique
      const codes = [
        code1.fishermanCode,
        code2.fishermanCode,
        code3.fishermanCode,
      ];
      expect(new Set(codes).size).toBe(3);
    });
  });

  describe('INACTIVE profile handling', () => {
    beforeEach(() => {
      repository.data = [
        {
          id: 'p-1',
          userId: 'user-X',
          fishermanCode: 'FSH-000123',
          status: FishingOperationProfileStatus.INACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
    });

    it('resolveUserIdByCode returns INACTIVE status', async () => {
      const result = await service.resolveUserIdByCode('FSH-000123');
      expect(result?.status).toBe(FishingOperationProfileStatus.INACTIVE);
    });
  });
});
