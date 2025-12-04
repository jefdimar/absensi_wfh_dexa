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
  ForbiddenException,
} from '@nestjs/common';
import { AttendanceService } from '../services/attendance.service';
import { CreateAttendanceDto } from '../dto/create-attendance.dto';
import {
  AttendanceResponseDto,
  AttendanceSummaryDto,
  AttendanceStatsDto,
  DateRangeStatsDto,
  PaginatedAttendanceDto,
} from '../dto/attendance-response.dto';
import { JwtAuthGuard } from '../config/guards/jwt-auth.guard';
import { AdminGuard } from '../config/guards/admin.guard';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  getHello(): string {
    return 'Attendance Service is running!';
  }

  @Get('health')
  getHealth(): object {
    return {
      service: 'attendance-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }

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
    @Request() req,
    @Body() createDto: CreateAttendanceDto,
  ): Promise<AttendanceResponseDto> {
    // Auto-fill employeeId from JWT token
    createDto.employeeId = req.user.employeeId;
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
    @Request() req,
  ): Promise<AttendanceResponseDto[]> {
    // Only allow viewing own records unless user is admin
    if (req.user.role !== 'admin' && req.user.employeeId !== employeeId) {
      throw new ForbiddenException('You can only view your own attendance records');
    }
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
    @Request() req,
  ): Promise<AttendanceSummaryDto> {
    // Only allow viewing own records unless user is admin
    if (req.user.role !== 'admin' && req.user.employeeId !== employeeId) {
      throw new ForbiddenException('You can only view your own attendance summary');
    }
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
    @Request() req,
  ): Promise<AttendanceStatsDto> {
    // Only allow viewing own records unless user is admin
    if (req.user.role !== 'admin' && req.user.employeeId !== employeeId) {
      throw new ForbiddenException('You can only view your own attendance stats');
    }
    return await this.attendanceService.getMonthlyStats(
      employeeId,
      year,
      month,
    );
  }

  // NEW ROUTE 1: GET /attendance/stats?startDate=2025-06-23&endDate=2025-06-23
  // Admin only - views all employees' attendance
  @UseGuards(AdminGuard)
  @Get('stats')
  async getDateRangeStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<DateRangeStatsDto> {
    if (!startDate || !endDate) {
      throw new Error('Both startDate and endDate are required');
    }
    return await this.attendanceService.getDateRangeStats(startDate, endDate);
  }

  // NEW ROUTE 2: GET /attendance/all?page=1&limit=10&date=2025-06-23
  // Admin only - views all employees' attendance
  @UseGuards(AdminGuard)
  @Get('all')
  async getAllAttendanceRecords(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query('date') date?: string,
  ): Promise<PaginatedAttendanceDto> {
    return await this.attendanceService.getAllAttendanceRecords(
      page,
      limit,
      date,
    );
  }
}
