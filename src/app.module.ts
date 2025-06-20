import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProfileChangeLogController } from './controllers/profile-change-log.controller';
import { ProfileChangeLogService } from './services/profile-change-log.service';
import { ProfileChangeLog } from './entities/profile-change-log.entity';
import { databaseConfig } from './config/database.config';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([ProfileChangeLog]),
  ],
  controllers: [AppController, ProfileChangeLogController],
  providers: [AppService, ProfileChangeLogService],
})
export class AppModule {}
