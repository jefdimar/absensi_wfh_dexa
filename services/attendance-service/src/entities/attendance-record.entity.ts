import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

export enum AttendanceStatus {
  CHECK_IN = 'check-in',
  CHECK_OUT = 'check-out',
}

@Entity('attendance_records')
@Index('idx_attendance_employee_id', ['employeeId'])
@Index('idx_attendance_timestamp', ['timestamp'])
// Unique constraint to prevent duplicate check-ins/check-outs on same day
// Note: This is a logical constraint - actual DB constraint should be added via migration
// Example: CREATE UNIQUE INDEX idx_attendance_unique_daily ON attendance_records (employee_id, DATE(timestamp), status)
export class AttendanceRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'employee_id' })
  employeeId: string;

  @Column('timestamp')
  timestamp: Date;

  @Column({
    type: 'varchar',
    length: 10,
    enum: AttendanceStatus,
  })
  status: AttendanceStatus;
}
