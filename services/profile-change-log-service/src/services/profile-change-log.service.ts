import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfileChangeLog } from '../entities/profile-change-log.entity';
import { CreateProfileChangeLogDto } from '../dto/create-profile-change-log.dto';

@Injectable()
export class ProfileChangeLogService {
  constructor(
    @InjectRepository(ProfileChangeLog)
    private readonly profileChangeLogRepository: Repository<ProfileChangeLog>,
  ) {}

  async create(
    createDto: CreateProfileChangeLogDto,
  ): Promise<ProfileChangeLog> {
    const profileChangeLog = this.profileChangeLogRepository.create(createDto);
    const savedLog =
      await this.profileChangeLogRepository.save(profileChangeLog);

    // Send notification to admin
    await this.sendNotificationToAdmin(savedLog);

    return savedLog;
  }

  async findByEmployeeId(employeeId: string): Promise<ProfileChangeLog[]> {
    return await this.profileChangeLogRepository.find({
      where: { employeeId },
      order: { changedAt: 'DESC' },
    });
  }

  async findAll(): Promise<ProfileChangeLog[]> {
    return await this.profileChangeLogRepository.find({
      order: { changedAt: 'DESC' },
    });
  }

  private async sendNotificationToAdmin(
    profileChangeLog: ProfileChangeLog,
  ): Promise<void> {
    try {
      const message = `Profile updated: ${profileChangeLog.changedField} changed from "${profileChangeLog.oldValue}" to "${profileChangeLog.newValue}" for employee ${profileChangeLog.employeeId}`;

      const notificationData = {
        employeeId: profileChangeLog.employeeId,
        message: message,
      };

      const response = await fetch(
        'http://notification-service:3004/notifications/create',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(notificationData),
        },
      );

      if (!response.ok) {
        console.error('Failed to send notification:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }
}
