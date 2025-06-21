import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return 'Auth Service is running!';
  }

  @Get('health')
  getHealth(): object {
    return {
      service: 'auth-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }
}
