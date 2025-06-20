import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { AttendanceService } from '../services/attendance.service';
import { CreateAttendanceDto } from '../dto/attendance/create-attendance.dto';
import {
  AttendanceResponseDto,
  AttendanceSummaryDto,
  AttendanceStatsDto,
} from '../dto/attendance/attendance-response.dto';
import { JwtAuthGuard } from '../config/guards/jwt-auth.guard';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('check-in')
  async checkIn(@Request() req): Promise<AttendanceResponseDto> {
    return await this.attendanceService.checkIn(req.user.employeeId);
  }

  @Post('check-out')
  async checkOut(@Request() req): Promise<AttendanceResponseDto> {
    return await this.attendanceService.checkOut(req.user.employeeId);
  }

  @Post()
  async createAttendance(
    @Body() createDto: CreateAttendanceDto,
  ): Promise<AttendanceResponseDto> {
    return await this.attendanceService.createAttendance(createDto);
  }

  @Get('my-records')
  async getMyAttendance(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<AttendanceResponseDto[]> {
    return await this.attendanceService.getAttendanceByEmployee(
      req.user.employeeId,
      startDate,
      endDate,
    );
  }

  @Get('employee/:employeeId')
  async getEmployeeAttendance(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<AttendanceResponseDto[]> {
    return await this.attendanceService.getAttendanceByEmployee(
      employeeId,
      startDate,
      endDate,
    );
  }

  @Get('summary/daily')
  async getDailySummary(
    @Request() req,
    @Query('date') date: string,
  ): Promise<AttendanceSummaryDto> {
    return await this.attendanceService.getDailySummary(
      req.user.employeeId,
      date,
    );
  }

  @Get('summary/daily/:employeeId')
  async getEmployeeDailySummary(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Query('date') date: string,
  ): Promise<AttendanceSummaryDto> {
    return await this.attendanceService.getDailySummary(employeeId, date);
  }

  @Get('stats/monthly')
  async getMyMonthlyStats(
    @Request() req,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
  ): Promise<AttendanceStatsDto> {
    return await this.attendanceService.getMonthlyStats(
      req.user.employeeId,
      year,
      month,
    );
  }

  @Get('stats/monthly/:employeeId')
  async getEmployeeMonthlyStats(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
  ): Promise<AttendanceStatsDto> {
    return await this.attendanceService.getMonthlyStats(
      employeeId,
      year,
      month,
    );
  }
}
