import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';

import { HealthService, HealthStatus } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  let mockDataSource: Partial<DataSource>;

  beforeEach(async () => {
    mockDataSource = {
      query: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  describe('checkHealth', () => {
    it('should return healthy status when database is connected', async () => {
      (mockDataSource.query as jest.Mock).mockResolvedValue([
        { '?column?': 1 },
      ]);

      const health = await service.checkHealth();

      expect(health.status).toBe('healthy');
      expect(health.timestamp).toBeDefined();
      expect(health.uptime).toBeGreaterThanOrEqual(0);
      expect(health.database.connected).toBe(true);
      expect(health.database.responseTime).toBeDefined();
    });

    it('should return unhealthy status when database is disconnected', async () => {
      (mockDataSource.query as jest.Mock).mockRejectedValue(
        new Error('Connection refused'),
      );

      const health = await service.checkHealth();

      expect(health.status).toBe('unhealthy');
      expect(health.database.connected).toBe(false);
    });

    it('should include memory usage information', async () => {
      const health = await service.checkHealth();

      expect(health.memory).toBeDefined();
      expect(health.memory.used).toBeGreaterThan(0);
      expect(health.memory.total).toBeGreaterThan(0);
      expect(health.memory.percentage).toBeGreaterThan(0);
      expect(health.memory.percentage).toBeLessThanOrEqual(100);
    });

    it('should include timestamp in ISO format', async () => {
      const health = await service.checkHealth();

      const timestampDate = new Date(health.timestamp);
      expect(timestampDate.toISOString()).toBe(health.timestamp);
    });

    it('should measure database response time', async () => {
      (mockDataSource.query as jest.Mock).mockResolvedValue([
        { '?column?': 1 },
      ]);

      const health = await service.checkHealth();

      expect(typeof health.database.responseTime).toBe('number');
      expect(health.database.responseTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('health status structure', () => {
    it('should return complete HealthStatus object', async () => {
      const health = await service.checkHealth();

      const expectedKeys: (keyof HealthStatus)[] = [
        'status',
        'timestamp',
        'uptime',
        'database',
        'memory',
      ];

      expectedKeys.forEach((key) => {
        expect(health).toHaveProperty(key);
      });
    });

    it('should have correct database structure', async () => {
      const health = await service.checkHealth();

      expect(health.database).toHaveProperty('connected');
      expect(typeof health.database.connected).toBe('boolean');
    });
  });
});
