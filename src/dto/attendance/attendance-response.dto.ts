import { AttendanceStatus } from '../../entities/attendance-record.entity';

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
