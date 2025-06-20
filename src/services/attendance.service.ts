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
import { CreateAttendanceDto } from '../dto/attendance/create-attendance.dto';
import {
  AttendanceResponseDto,
  AttendanceSummaryDto,
  AttendanceStatsDto,
} from '../dto/attendance/attendance-response.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(AttendanceRecord)
    private readonly attendanceRepository: Repository<AttendanceRecord>,
  ) {}

  async checkIn(employeeId: string): Promise<AttendanceResponseDto> {
    // Check if already checked in today
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
    );

    const existingCheckIn = await this.attendanceRepository.findOne({
      where: {
        employeeId,
        status: AttendanceStatus.CHECK_IN,
        timestamp: Between(startOfDay, endOfDay),
      },
    });

    if (existingCheckIn) {
      throw new BadRequestException('Already checked in today');
    }

    const attendance = this.attendanceRepository.create({
      employeeId,
      status: AttendanceStatus.CHECK_IN,
      timestamp: new Date(),
    });

    const savedAttendance = await this.attendanceRepository.save(attendance);
    return this.mapToResponse(savedAttendance);
  }

  async checkOut(employeeId: string): Promise<AttendanceResponseDto> {
    // Check if checked in today
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
    );

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

    // Check if already checked out
    const existingCheckOut = await this.attendanceRepository.findOne({
      where: {
        employeeId,
        status: AttendanceStatus.CHECK_OUT,
        timestamp: Between(startOfDay, endOfDay),
      },
    });

    if (existingCheckOut) {
      throw new BadRequestException('Already checked out today');
    }

    const attendance = this.attendanceRepository.create({
      employeeId,
      status: AttendanceStatus.CHECK_OUT,
      timestamp: new Date(),
    });

    const savedAttendance = await this.attendanceRepository.save(attendance);
    return this.mapToResponse(savedAttendance);
  }

  async createAttendance(
    createDto: CreateAttendanceDto,
  ): Promise<AttendanceResponseDto> {
    const attendance = this.attendanceRepository.create({
      ...createDto,
      timestamp: createDto.timestamp
        ? new Date(createDto.timestamp)
        : new Date(),
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
    const startOfDay = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
    );
    const endOfDay = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
      23,
      59,
      59,
    );

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

  private mapToResponse(attendance: AttendanceRecord): AttendanceResponseDto {
    return {
      id: attendance.id,
      employeeId: attendance.employeeId,
      timestamp: attendance.timestamp,
      status: attendance.status,
    };
  }
}
