import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { NotificationService } from '../services/notification.service';
import { AdminNotification } from '../entities/admin-notification.entity';
import { CreateNotificationDto } from '../dto/create-notification.dto';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('create')
  async createNotification(
    @Body() createDto: CreateNotificationDto,
  ): Promise<AdminNotification> {
    return await this.notificationService.createNotification(
      createDto.employeeId,
      createDto.message,
    );
  }

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
