import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  database: {
    connected: boolean;
    responseTime?: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  constructor(private readonly dataSource: DataSource) {}

  async checkHealth(): Promise<HealthStatus> {
    const dbHealth = await this.checkDatabase();
    const memoryUsage = this.getMemoryUsage();

    const isHealthy = dbHealth.connected;

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      database: dbHealth,
      memory: memoryUsage,
    };
  }

  private async checkDatabase(): Promise<{
    connected: boolean;
    responseTime?: number;
  }> {
    const start = Date.now();
    try {
      await this.dataSource.query('SELECT 1');
      return {
        connected: true,
        responseTime: Date.now() - start,
      };
    } catch {
      return { connected: false };
    }
  }

  private getMemoryUsage(): {
    used: number;
    total: number;
    percentage: number;
  } {
    const used = process.memoryUsage();
    const heapUsedMB = used.heapUsed / 1024 / 1024;
    const heapTotalMB = used.heapTotal / 1024 / 1024;
    const percentage = (heapUsedMB / heapTotalMB) * 100;

    return {
      used: Math.round(heapUsedMB * 100) / 100,
      total: Math.round(heapTotalMB * 100) / 100,
      percentage: Math.round(percentage * 100) / 100,
    };
  }
}
