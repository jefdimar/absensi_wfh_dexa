import { Injectable } from '@nestjs/common';
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

  async getUnreadNotifications(): Promise<AdminNotification[]> {
    return await this.notificationRepository.find({
      where: { read: false },
      order: { createdAt: 'DESC' },
    });
  }

  async getAllNotifications(): Promise<AdminNotification[]> {
    return await this.notificationRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: string): Promise<AdminNotification> {
    await this.notificationRepository.update(id, { read: true });
    return await this.notificationRepository.findOne({ where: { id } });
  }
}