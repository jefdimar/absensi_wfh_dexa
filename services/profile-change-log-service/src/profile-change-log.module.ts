import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ProfileChangeLogController } from './controllers/profile-change-log.controller';
import { ProfileChangeLogService } from './services/profile-change-log.service';
import { ProfileChangeLog } from './entities/profile-change-log.entity';
import { getDatabaseConfig } from './config/database.config';
import { AppController } from './controllers/app.controller';
import { JwtStrategy } from './strategies/jwt.strategy';

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
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN', '24h') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController, ProfileChangeLogController],
  providers: [ProfileChangeLogService, JwtStrategy],
})
export class ProfileChangeLogModule {}
