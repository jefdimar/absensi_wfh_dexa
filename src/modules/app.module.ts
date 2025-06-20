import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '../modules/auth.module';
import { AttendanceModule } from './attendance.module';
import { ProfileChangeLogModule } from './profile-change-log.module';
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
    AuthModule,
    AttendanceModule,
    ProfileChangeLogModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
