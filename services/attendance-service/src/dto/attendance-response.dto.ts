import { AttendanceStatus } from '../entities/attendance-record.entity';

export class AttendanceResponseDto {
  id: string;
  employeeId: string;
  timestamp: Date;
  status: AttendanceStatus;
}

export class AttendanceSummaryDto {
  employeeId: string;
  date: string;
  checkInTime?: Date;
  checkOutTime?: Date;
  workingHours?: number;
  status: 'present' | 'incomplete' | 'absent';
}

export class AttendanceStatsDto {
  totalDays: number;
  presentDays: number;
  incompleteDays: number;
  absentDays: number;
  averageWorkingHours: number;
}

// New DTOs for the new routes
export class DateRangeStatsDto {
  startDate: string;
  endDate: string;
  totalRecords: number;
  totalCheckIns: number;
  totalCheckOuts: number;
  uniqueEmployees: number;
  dailyBreakdown: DailyStatsDto[];
}

export class DailyStatsDto {
  date: string;
  checkIns: number;
  checkOuts: number;
  uniqueEmployees: number;
}

export class PaginatedAttendanceDto {
  data: AttendanceResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
