import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return 'Attendance Service is running!';
  }

  @Get('health')
  getHealth(): object {
    return {
      service: 'attendance-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }
}
