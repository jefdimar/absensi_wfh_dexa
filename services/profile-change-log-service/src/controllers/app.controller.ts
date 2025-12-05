import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller()
export class AppController {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  @Get()
  getHello(): string {
    return 'Profile Change Log Service is running!';
  }

  @Get('health')
  async getHealth(): Promise<object> {
    let dbStatus = 'unhealthy';
    try {
      await this.dataSource.query('SELECT 1');
      dbStatus = 'healthy';
    } catch (error) {
      console.error('Database health check failed:', error.message);
    }

    const isHealthy = dbStatus === 'healthy';
    return {
      service: 'profile-change-log-service',
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbStatus,
      },
    };
  }
}
