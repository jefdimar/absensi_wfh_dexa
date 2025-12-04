import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  AttendanceRecord,
  AttendanceStatus,
} from '../entities/attendance-record.entity';
import { CreateAttendanceDto } from '../dto/create-attendance.dto';
import {
  AttendanceResponseDto,
  AttendanceSummaryDto,
  AttendanceStatsDto,
  DateRangeStatsDto,
  DailyStatsDto,
  PaginatedAttendanceDto,
} from '../dto/attendance-response.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(AttendanceRecord)
    private readonly attendanceRepository: Repository<AttendanceRecord>,
  ) {}

  /**
   * Get start and end of day in UTC to ensure consistent timezone handling
   * @param date - Optional date, defaults to today
   * @returns Object with startOfDay and endOfDay Date objects in UTC
   */
  private getUTCDayBounds(date?: Date): { startOfDay: Date; endOfDay: Date } {
    const targetDate = date || new Date();
    const startOfDay = new Date(Date.UTC(
      targetDate.getUTCFullYear(),
      targetDate.getUTCMonth(),
      targetDate.getUTCDate(),
      0, 0, 0, 0
    ));
    const endOfDay = new Date(Date.UTC(
      targetDate.getUTCFullYear(),
      targetDate.getUTCMonth(),
      targetDate.getUTCDate(),
      23, 59, 59, 999
    ));
    return { startOfDay, endOfDay };
  }

  async checkIn(employeeId: string): Promise<AttendanceResponseDto> {
    const attendance = this.attendanceRepository.create({
      employeeId,
      status: AttendanceStatus.CHECK_IN,
      timestamp: new Date(),
    });

    try {
      const savedAttendance = await this.attendanceRepository.save(attendance);
      return this.mapToResponse(savedAttendance);
    } catch (error) {
      // Handle duplicate check-in attempts
      // Note: This assumes a unique constraint exists on (employee_id, DATE(timestamp), status)
      // Without the DB constraint, race conditions can still occur
      if (error.code === '23505') {
        throw new BadRequestException('Already checked in today');
      }
      throw error;
    }
  }

  async checkOut(employeeId: string): Promise<AttendanceResponseDto> {
    // Verify check-in exists for today (business logic requirement)
    const { startOfDay, endOfDay } = this.getUTCDayBounds();

    const checkInRecord = await this.attendanceRepository.findOne({
      where: {
        employeeId,
        status: AttendanceStatus.CHECK_IN,
        timestamp: Between(startOfDay, endOfDay),
      },
    });

    if (!checkInRecord) {
      throw new BadRequestException('No check-in record found for today');
    }

    const attendance = this.attendanceRepository.create({
      employeeId,
      status: AttendanceStatus.CHECK_OUT,
      timestamp: new Date(),
    });

    try {
      const savedAttendance = await this.attendanceRepository.save(attendance);
      return this.mapToResponse(savedAttendance);
    } catch (error) {
      // Handle duplicate check-out attempts
      if (error.code === '23505') {
        throw new BadRequestException('Already checked out today');
      }
      throw error;
    }
  }

  async createAttendance(
    createDto: CreateAttendanceDto,
  ): Promise<AttendanceResponseDto> {
    const attendance = this.attendanceRepository.create({
      ...createDto,
      timestamp: new Date(),
    });

    const savedAttendance = await this.attendanceRepository.save(attendance);
    return this.mapToResponse(savedAttendance);
  }

  async getAttendanceByEmployee(
    employeeId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<AttendanceResponseDto[]> {
    const whereCondition: any = { employeeId };

    if (startDate && endDate) {
      whereCondition.timestamp = Between(
        new Date(startDate),
        new Date(endDate),
      );
    }

    const records = await this.attendanceRepository.find({
      where: whereCondition,
      order: { timestamp: 'DESC' },
    });

    return records.map((record) => this.mapToResponse(record));
  }

  async getDailySummary(
    employeeId: string,
    date: string,
  ): Promise<AttendanceSummaryDto> {
    const targetDate = new Date(date);
    const { startOfDay, endOfDay } = this.getUTCDayBounds(targetDate);

    const records = await this.attendanceRepository.find({
      where: {
        employeeId,
        timestamp: Between(startOfDay, endOfDay),
      },
      order: { timestamp: 'ASC' },
    });

    const checkIn = records.find((r) => r.status === AttendanceStatus.CHECK_IN);
    const checkOut = records.find(
      (r) => r.status === AttendanceStatus.CHECK_OUT,
    );

    let workingHours = 0;
    let status: 'present' | 'incomplete' | 'absent' = 'absent';

    if (checkIn && checkOut) {
      workingHours =
        (checkOut.timestamp.getTime() - checkIn.timestamp.getTime()) /
        (1000 * 60 * 60);
      status = 'present';
    } else if (checkIn) {
      status = 'incomplete';
    }

    return {
      employeeId,
      date,
      checkInTime: checkIn?.timestamp,
      checkOutTime: checkOut?.timestamp,
      workingHours:
        workingHours > 0 ? Math.round(workingHours * 100) / 100 : undefined,
      status,
    };
  }

  async getMonthlyStats(
    employeeId: string,
    year: number,
    month: number,
  ): Promise<AttendanceStatsDto> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const records = await this.attendanceRepository.find({
      where: {
        employeeId,
        timestamp: Between(startDate, endDate),
      },
      order: { timestamp: 'ASC' },
    });

    // Group by date
    const dailyRecords = new Map<string, AttendanceRecord[]>();
    records.forEach((record) => {
      const dateKey = record.timestamp.toISOString().split('T')[0];
      if (!dailyRecords.has(dateKey)) {
        dailyRecords.set(dateKey, []);
      }
      dailyRecords.get(dateKey)!.push(record);
    });

    let presentDays = 0;
    let incompleteDays = 0;
    let totalWorkingHours = 0;

    dailyRecords.forEach((dayRecords) => {
      const checkIn = dayRecords.find(
        (r) => r.status === AttendanceStatus.CHECK_IN,
      );
      const checkOut = dayRecords.find(
        (r) => r.status === AttendanceStatus.CHECK_OUT,
      );

      if (checkIn && checkOut) {
        presentDays++;
        const hours =
          (checkOut.timestamp.getTime() - checkIn.timestamp.getTime()) /
          (1000 * 60 * 60);
        totalWorkingHours += hours;
      } else if (checkIn) {
        incompleteDays++;
      }
    });

    const totalDays = endDate.getDate();
    const absentDays = totalDays - presentDays - incompleteDays;
    const averageWorkingHours =
      presentDays > 0
        ? Math.round((totalWorkingHours / presentDays) * 100) / 100
        : 0;

    return {
      totalDays,
      presentDays,
      incompleteDays,
      absentDays,
      averageWorkingHours,
    };
  }

  // NEW METHOD: Get date range statistics
  async getDateRangeStats(
    startDate: string,
    endDate: string,
  ): Promise<DateRangeStatsDto> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate date range (max 365 days to prevent performance issues)
    const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 365) {
      throw new BadRequestException('Date range cannot exceed 365 days');
    }
    if (daysDiff < 0) {
      throw new BadRequestException('End date must be after start date');
    }

    // Set end date to end of day
    end.setHours(23, 59, 59, 999);

    const records = await this.attendanceRepository.find({
      where: {
        timestamp: Between(start, end),
      },
      order: { timestamp: 'ASC' },
    });

    const totalRecords = records.length;
    const totalCheckIns = records.filter(
      (r) => r.status === AttendanceStatus.CHECK_IN,
    ).length;
    const totalCheckOuts = records.filter(
      (r) => r.status === AttendanceStatus.CHECK_OUT,
    ).length;
    const uniqueEmployees = new Set(records.map((r) => r.employeeId)).size;

    // Group by date for daily breakdown
    const dailyMap = new Map<
      string,
      { checkIns: number; checkOuts: number; employees: Set<string> }
    >();

    records.forEach((record) => {
      const dateKey = record.timestamp.toISOString().split('T')[0];
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {
          checkIns: 0,
          checkOuts: 0,
          employees: new Set(),
        });
      }

      const dayData = dailyMap.get(dateKey)!;
      dayData.employees.add(record.employeeId);

      if (record.status === AttendanceStatus.CHECK_IN) {
        dayData.checkIns++;
      } else {
        dayData.checkOuts++;
      }
    });

    const dailyBreakdown: DailyStatsDto[] = Array.from(dailyMap.entries()).map(
      ([date, data]) => ({
        date,
        checkIns: data.checkIns,
        checkOuts: data.checkOuts,
        uniqueEmployees: data.employees.size,
      }),
    );

    return {
      startDate,
      endDate,
      totalRecords,
      totalCheckIns,
      totalCheckOuts,
      uniqueEmployees,
      dailyBreakdown,
    };
  }

  // NEW METHOD: Get all attendance records with pagination and date filter
  async getAllAttendanceRecords(
    page: number = 1,
    limit: number = 10,
    date?: string,
  ): Promise<PaginatedAttendanceDto> {
    const skip = (page - 1) * limit;
    let whereCondition: any = {};

    if (date) {
      const targetDate = new Date(date);
      const { startOfDay, endOfDay } = this.getUTCDayBounds(targetDate);
      whereCondition.timestamp = Between(startOfDay, endOfDay);
    }

    const [records, total] = await this.attendanceRepository.findAndCount({
      where: whereCondition,
      order: { timestamp: 'DESC' },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: records.map((record) => this.mapToResponse(record)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  private mapToResponse(attendance: AttendanceRecord): AttendanceResponseDto {
    return {
      id: attendance.id,
      employeeId: attendance.employeeId,
      timestamp: attendance.timestamp,
      status: attendance.status,
    };
  }
}
