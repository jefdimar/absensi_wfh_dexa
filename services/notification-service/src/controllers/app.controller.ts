import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return 'Notification Service is running!';
  }

  @Get('health')
  getHealth(): object {
    return {
      service: 'notification-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }
}