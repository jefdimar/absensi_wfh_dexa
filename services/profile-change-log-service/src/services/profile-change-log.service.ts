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
    return await this.profileChangeLogRepository.save(profileChangeLog);
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
}
