import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceController } from '../controllers/attendance.controller';
import { AttendanceService } from '../services/attendance.service';
import { AttendanceRecord } from '../entities/attendance-record.entity';
import { Employee } from '../entities/employee.entity';
import { JwtStrategy } from '../config/strategies/jwt.strategy';

@Module({
  imports: [TypeOrmModule.forFeature([AttendanceRecord, Employee])],
  controllers: [AttendanceController],
  providers: [AttendanceService, JwtStrategy],
  exports: [AttendanceService],
})
export class AttendanceModule {}
