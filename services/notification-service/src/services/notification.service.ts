import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminNotification } from '../entities/admin-notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(AdminNotification)
    private readonly notificationRepository: Repository<AdminNotification>,
  ) {}

  async createNotification(
    employeeId: string,
    message: string,
  ): Promise<AdminNotification> {
    const notification = this.notificationRepository.create({
      employeeId,
      message,
    });
    return await this.notificationRepository.save(notification);
  }

  async getUnreadNotifications(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: AdminNotification[]; total: number; page: number; limit: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.notificationRepository.findAndCount({
      where: { read: false },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getAllNotifications(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: AdminNotification[]; total: number; page: number; limit: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.notificationRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async markAsRead(id: string): Promise<AdminNotification> {
    const notification = await this.notificationRepository.findOne({ where: { id } });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.read = true;
    return await this.notificationRepository.save(notification);
  }
}