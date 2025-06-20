import { IsUUID, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { AttendanceStatus } from '../../entities/attendance-record.entity';

export class CreateAttendanceDto {
  @IsUUID()
  employeeId: string;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsOptional()
  @IsDateString()
  timestamp?: string;
}
