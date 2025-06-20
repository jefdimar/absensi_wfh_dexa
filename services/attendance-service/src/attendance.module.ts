import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AttendanceController } from './controllers/attendance.controller';
import { AttendanceService } from './services/attendance.service';
import { AttendanceRecord } from './entities/attendance-record.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { getDatabaseConfig } from './config/database.config';
import { AppController } from './controllers/app.controller';

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
    TypeOrmModule.forFeature([AttendanceRecord]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES_IN', '24h') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController, AttendanceController],
  providers: [AttendanceService, JwtStrategy],
})
export class AttendanceModule {}
