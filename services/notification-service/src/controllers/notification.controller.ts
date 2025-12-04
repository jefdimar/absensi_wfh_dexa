import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from '../services/notification.service';
import { AdminNotification } from '../entities/admin-notification.entity';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { JwtAuthGuard } from '../config/guards/jwt-auth.guard';
import { AdminGuard } from '../config/guards/admin.guard';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // POST endpoint remains unprotected for inter-service communication
  // Services can call this without JWT token
  @Post('create')
  async createNotification(
    @Body() createDto: CreateNotificationDto,
  ): Promise<AdminNotification> {
    return await this.notificationService.createNotification(
      createDto.employeeId,
      createDto.message,
    );
  }

  // GET and PATCH endpoints require admin authentication
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  async getAllNotifications(): Promise<AdminNotification[]> {
    return await this.notificationService.getAllNotifications();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('unread')
  async getUnreadNotifications(): Promise<AdminNotification[]> {
    return await this.notificationService.getUnreadNotifications();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id/read')
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AdminNotification> {
    return await this.notificationService.markAsRead(id);
  }
}
