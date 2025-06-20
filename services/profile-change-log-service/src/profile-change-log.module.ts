import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProfileChangeLogController } from './controllers/profile-change-log.controller';
import { ProfileChangeLogService } from './services/profile-change-log.service';
import { ProfileChangeLog } from './entities/profile-change-log.entity';
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
    TypeOrmModule.forFeature([ProfileChangeLog]),
  ],
  controllers: [AppController, ProfileChangeLogController],
  providers: [ProfileChangeLogService],
})
export class ProfileChangeLogModule {}
