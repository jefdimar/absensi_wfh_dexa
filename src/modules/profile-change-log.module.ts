import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileChangeLogController } from '../controllers/profile-change-log.controller';
import { ProfileChangeLogService } from '../services/profile-change-log.service';
import { ProfileChangeLog } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([ProfileChangeLog])],
  controllers: [ProfileChangeLogController],
  providers: [ProfileChangeLogService],
  exports: [ProfileChangeLogService],
})
export class ProfileChangeLogModule {}
