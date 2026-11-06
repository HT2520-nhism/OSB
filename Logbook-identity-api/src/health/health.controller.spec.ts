import { Test, TestingModule } from '@nestjs/testing';

import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let mockHealthService: Partial<HealthService>;

  beforeEach(async () => {
    mockHealthService = {
      checkHealth: jest.fn().mockResolvedValue({
        status: 'healthy',
        timestamp: '2026-05-29T10:00:00.000Z',
        uptime: 3600,
        database: {
          connected: true,
          responseTime: 5,
        },
        memory: {
          used: 120,
          total: 512,
          percentage: 23.4,
        },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: mockHealthService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  describe('checkHealth', () => {
    it('should return health status from service', async () => {
      const result = await controller.checkHealth();

      expect(result).toEqual({
        status: 'healthy',
        timestamp: '2026-05-29T10:00:00.000Z',
        uptime: 3600,
        database: {
          connected: true,
          responseTime: 5,
        },
        memory: {
          used: 120,
          total: 512,
          percentage: 23.4,
        },
      });
      expect(mockHealthService.checkHealth).toHaveBeenCalled();
    });
  });

  describe('liveness', () => {
    it('should return ok status for liveness probe', () => {
      const result = controller.liveness();

      expect(result).toEqual({ status: 'ok' });
    });
  });

  describe('readiness', () => {
    it('should return ready status when application is healthy', async () => {
      const result = await controller.readiness();

      expect(result).toEqual({
        status: 'healthy',
        ready: true,
      });
    });

    it('should return not ready when application is unhealthy', async () => {
      (mockHealthService.checkHealth as jest.Mock).mockResolvedValueOnce({
        status: 'unhealthy',
        database: { connected: false },
      });

      const result = await controller.readiness();

      expect(result).toEqual({
        status: 'unhealthy',
        ready: false,
      });
    });
  });
});
