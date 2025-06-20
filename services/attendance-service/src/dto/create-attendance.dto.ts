import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export enum AttendanceStatus {
  CHECK_IN = 'check-in',
  CHECK_OUT = 'check-out',
}

export class CreateAttendanceDto {
  @IsOptional()
  @IsUUID()
  employeeId: string;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
