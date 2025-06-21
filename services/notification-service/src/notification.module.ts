import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationController } from './controllers/notification.controller';
import { NotificationService } from './services/notification.service';
import { AdminNotification } from './entities/admin-notification.entity';
import { getDatabaseConfig } from './config/database.config';
import { AppController } from './controllers/app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        getDatabaseConfig(configService),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([AdminNotification]),
  ],
  controllers: [AppController, NotificationController],
  providers: [NotificationService],
})
export class NotificationModule {}
