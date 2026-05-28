import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Announcement } from '../../../database/entities/announcement.entity';
import { TeacherAnnouncementController } from './teacher-announcement.controller';
import { TeacherAnnouncementService } from './teacher-announcement.service';
import { TeacherCacheModule } from '../common/teacher-cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Announcement]),
    TeacherCacheModule,
  ],
  controllers: [TeacherAnnouncementController],
  providers: [TeacherAnnouncementService],
  exports: [TeacherAnnouncementService],
})
export class TeacherAnnouncementModule {}
