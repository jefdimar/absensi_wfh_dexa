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
    return 'Auth Service is running!';
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
      service: 'auth-service',
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbStatus,
      },
    };
  }
}
