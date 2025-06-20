import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProfileChangeLogController } from '../controllers/profile-change-log.controller';
import { ProfileChangeLogService } from '../services/profile-change-log.service';
import { ProfileChangeLog } from '../entities/profile-change-log.entity';
import { Employee } from '../entities/employee.entity';
import { AttendanceRecord } from '../entities/attendance-record.entity';
import { AuthModule } from '../modules/auth.module';
import { AttendanceModule } from './attendance.module';
import { getDatabaseConfig } from '../config/databases/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        getDatabaseConfig(configService),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([ProfileChangeLog]),
    AuthModule,
    AttendanceModule,
  ],
  controllers: [ProfileChangeLogController],
  providers: [ProfileChangeLogService],
})
export class AppModule {}
