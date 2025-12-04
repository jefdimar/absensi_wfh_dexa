import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { NotificationService } from '../services/notification.service';
import { AdminNotification } from '../entities/admin-notification.entity';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { JwtAuthGuard } from '../config/guards/jwt-auth.guard';
import { AdminGuard } from '../config/guards/admin.guard';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Validates pagination parameters
   * @param page - Page number (must be >= 1)
   * @param limit - Items per page (must be between 1 and 100)
   */
  private validatePagination(page: number, limit: number): void {
    if (page < 1) {
      throw new BadRequestException('Page must be greater than or equal to 1');
    }
    if (limit < 1) {
      throw new BadRequestException('Limit must be greater than or equal to 1');
    }
    if (limit > 100) {
      throw new BadRequestException('Limit cannot exceed 100');
    }
  }

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

  // GET and PATCH endpoints require admin authentication with pagination
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  async getAllNotifications(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    this.validatePagination(page, limit);
    return await this.notificationService.getAllNotifications(page, limit);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('unread')
  async getUnreadNotifications(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    this.validatePagination(page, limit);
    return await this.notificationService.getUnreadNotifications(page, limit);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id/read')
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AdminNotification> {
    return await this.notificationService.markAsRead(id);
  }
}
