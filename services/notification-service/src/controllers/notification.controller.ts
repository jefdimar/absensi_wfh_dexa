import {
  Controller,
  Get,
  Patch,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { NotificationService } from '../services/notification.service';
import { AdminNotification } from '../entities/admin-notification.entity';

@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
  ) {}

  @Get()
  async getAllNotifications(): Promise<AdminNotification[]> {
    return await this.notificationService.getAllNotifications();
  }

  @Get('unread')
  async getUnreadNotifications(): Promise<AdminNotification[]> {
    return await this.notificationService.getUnreadNotifications();
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AdminNotification> {
    return await this.notificationService.markAsRead(id);
  }
}