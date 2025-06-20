import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ProfileChangeLogService } from '../services/profile-change-log.service';
import { CreateProfileChangeLogDto } from '../dto/profile/create-profile-change-log.dto';
import { ProfileChangeLog } from '../entities/profile-change-log.entity';

@Controller('profile-change-logs')
export class ProfileChangeLogController {
  constructor(
    private readonly profileChangeLogService: ProfileChangeLogService,
  ) {}

  @Post()
  async create(
    @Body() createDto: CreateProfileChangeLogDto,
  ): Promise<ProfileChangeLog> {
    return await this.profileChangeLogService.create(createDto);
  }

  @Get()
  async findAll(): Promise<ProfileChangeLog[]> {
    return await this.profileChangeLogService.findAll();
  }

  @Get('employee/:employeeId')
  async findByEmployeeId(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ): Promise<ProfileChangeLog[]> {
    return await this.profileChangeLogService.findByEmployeeId(employeeId);
  }
}
