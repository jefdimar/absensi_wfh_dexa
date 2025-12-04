import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ProfileChangeLogService } from '../services/profile-change-log.service';
import { CreateProfileChangeLogDto } from '../dto/create-profile-change-log.dto';
import { ProfileChangeLog } from '../entities/profile-change-log.entity';
import { JwtAuthGuard } from '../config/guards/jwt-auth.guard';
import { AdminGuard } from '../config/guards/admin.guard';

@Controller('profile-change-logs')
export class ProfileChangeLogController {
  constructor(
    private readonly profileChangeLogService: ProfileChangeLogService,
  ) {}

  // POST endpoint remains unprotected for inter-service communication
  // Services can call this without JWT token
  @Post()
  async create(
    @Body() createDto: CreateProfileChangeLogDto,
  ): Promise<ProfileChangeLog> {
    return await this.profileChangeLogService.create(createDto);
  }

  // GET endpoints require admin authentication
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  async findAll(): Promise<ProfileChangeLog[]> {
    return await this.profileChangeLogService.findAll();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('employee/:employeeId')
  async findByEmployeeId(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ): Promise<ProfileChangeLog[]> {
    return await this.profileChangeLogService.findByEmployeeId(employeeId);
  }
}
