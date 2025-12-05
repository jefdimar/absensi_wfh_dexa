import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { Employee } from './entities/employee.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './config/guards/jwt-auth.guard';
import { AdminGuard } from './config/guards/admin.guard';
import { getDatabaseConfig } from './config/database.config';
import { AppController } from './controllers/app.controller';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';

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
    TypeOrmModule.forFeature([Employee]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES_IN', '24h') },
      }),
      inject: [ConfigService],
    }),
    // Rate limiting: 10 requests per 1 minute per IP
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 10, // 10 requests
      },
    ]),
  ],
  controllers: [AuthController, AppController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    AdminGuard,
    // Apply throttler globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Apply global exception filter
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
  exports: [JwtAuthGuard, AdminGuard], // Export guards for use in other modules if needed
})
export class AuthModule {}
