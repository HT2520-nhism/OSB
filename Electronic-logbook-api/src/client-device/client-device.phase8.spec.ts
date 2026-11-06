/**
 * PHASE 8 — Client Device Service authorization tests.
 */

import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ClientDeviceService } from './client-device.service';
import type { AuthUser } from '../auth/current-user.decorator';

const userA: AuthUser = { accountId: 'user-A' };
const userB: AuthUser = { accountId: 'user-B' };

class FakeRepo {
  public data: Array<Record<string, unknown>> = [];

  find({
    where,
  }: {
    where: Record<string, unknown>;
  }): Promise<Array<Record<string, unknown>>> {
    const list = this.data.filter((d) => {
      return Object.entries(where).every(([k, v]) => d[k] === v);
    });
    return Promise.resolve(list);
  }

  findOne({
    where,
  }: {
    where: Record<string, unknown>;
  }): Promise<Record<string, unknown> | null> {
    return Promise.resolve(
      this.data.find((d) => {
        return Object.entries(where).every(([k, v]) => d[k] === v);
      }) ?? null,
    );
  }

  // TypeORM's Repository.create takes only the data, not the entity as a first arg
  create(data?: Record<string, unknown>) {
    const safe = (data ?? {}) as Record<string, unknown>;
    return { ...safe, id: (safe.id as string) ?? crypto.randomUUID() };
  }

  async save(entity: Record<string, unknown>) {
    const stored = {
      ...entity,
      id: (entity.id as string) ?? crypto.randomUUID(),
    };
    this.data.push(stored);
    return stored;
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

describe('ClientDeviceService - user-scoped visibility', () => {
  let service: ClientDeviceService;
  let repository: FakeRepo;

  beforeEach(() => {
    repository = new FakeRepo();
    repository.data = [
      {
        id: 'd-1',
        userId: 'user-A',
        deviceId: 'device-A-001',
        platform: 'android',
      },
      {
        id: 'd-2',
        userId: 'user-B',
        deviceId: 'device-B-001',
        platform: 'ios',
      },
      {
        id: 'd-3',
        userId: 'user-A',
        deviceId: 'device-A-002',
        platform: 'android',
      },
    ];

    service = new ClientDeviceService(repository as never);
    (service as unknown as { logger: unknown }).logger =
      new FakeServiceLogger();
  });

  describe('findAll', () => {
    it('returns empty array when no user', async () => {
      const result = await service.findAll();
      expect(result).toEqual([]);
    });

    it('returns only devices belonging to the user', async () => {
      const result = await service.findAll(userA);
      expect(result.length).toBe(2);
      result.forEach((d) => expect(d.userId).toBe('user-A'));
    });

    it('returns empty when user has no devices', async () => {
      const orphan: AuthUser = { accountId: 'orphan' };
      const result = await service.findAll(orphan);
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('returns device if owned by user', async () => {
      const result = await service.findOne('d-1', userA);
      expect(result.id).toBe('d-1');
    });

    it('returns NotFound (hides existence) if owned by another user', async () => {
      await expect(service.findOne('d-2', userA)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFound if device does not exist', async () => {
      await expect(service.findOne('nope', userA)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByDeviceId', () => {
    it('returns device if owned by user', async () => {
      const result = await service.findByDeviceId('device-A-001', userA);
      expect(result?.id).toBe('d-1');
    });

    it('returns null if device owned by another user', async () => {
      const result = await service.findByDeviceId('device-B-001', userA);
      expect(result).toBeNull();
    });

    it('returns null if device does not exist', async () => {
      const result = await service.findByDeviceId('does-not-exist', userA);
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('always sets userId from authenticated user', async () => {
      const result = await service.create(
        { deviceId: 'device-A-003', platform: 'web' } as never,
        userA,
      );
      // result is from save() which should return the stored object with userId
      expect(result).toBeTruthy();
      expect(result['userId']).toBe('user-A');
      expect(result['deviceId']).toBe('device-A-003');
    });

    it('throws Forbidden when user is missing', async () => {
      const noUser = { accountId: '' } as AuthUser;
      await expect(
        service.create({ deviceId: 'test' } as never, noUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('ignores userId from DTO and uses authenticated user', async () => {
      // Even if DTO tries to set userId, the service should overwrite with authenticated user
      const result = await service.create(
        { deviceId: 'device-evil', userId: 'user-B' } as never,
        userA,
      );
      expect(result['userId']).toBe('user-A'); // NOT user-B
    });
  });

  describe('update', () => {
    it('allows owner to update own device', async () => {
      const result = await service.update('d-1', { platform: 'web' }, userA);
      expect(result.platform).toBe('web');
    });

    it('throws NotFound if device is not owned by user', async () => {
      await expect(
        service.update('d-2', { platform: 'web' }, userA),
      ).rejects.toThrow(NotFoundException);
    });

    it('prevents reassigning device to another user', async () => {
      await expect(
        service.update('d-1', { userId: 'user-B' }, userA),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('allows owner to delete their device', async () => {
      await service.remove('d-1', userA);
      const list = await service.findAll(userA);
      expect(list.find((d) => d.id === 'd-1')).toBeUndefined();
    });

    it('throws NotFound if device is not owned by user', async () => {
      await expect(service.remove('d-2', userA)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
