import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { HealthService, HealthStatus } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Application is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'healthy' },
        timestamp: { type: 'string', example: '2026-05-29T10:00:00.000Z' },
        uptime: { type: 'number', example: 3600 },
        database: {
          type: 'object',
          properties: {
            connected: { type: 'boolean', example: true },
            responseTime: { type: 'number', example: 5 },
          },
        },
        memory: {
          type: 'object',
          properties: {
            used: { type: 'number', example: 120 },
            total: { type: 'number', example: 512 },
            percentage: { type: 'number', example: 23.4 },
          },
        },
      },
    },
  })
  async checkHealth(): Promise<HealthStatus> {
    return this.healthService.checkHealth();
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'Application is alive' })
  liveness(): { status: string } {
    return { status: 'ok' };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  async readiness(): Promise<{ status: string; ready: boolean }> {
    const health = await this.healthService.checkHealth();
    return {
      status: health.status,
      ready: health.status === 'healthy',
    };
  }
}
