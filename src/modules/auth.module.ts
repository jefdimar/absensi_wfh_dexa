import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { Employee } from '../entities/employee.entity';
import { ProfileChangeLog } from '../entities/profile-change-log.entity';
import { ProfileChangeLogService } from '../services/profile-change-log.service';
import { JwtStrategy } from '../config/strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([Employee, ProfileChangeLog]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES_IN') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, ProfileChangeLogService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
