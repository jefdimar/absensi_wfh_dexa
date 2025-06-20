import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return 'Profile Change Log Service is running!';
  }

  @Get('health')
  getHealth(): object {
    return {
      service: 'profile-change-log-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }
}
