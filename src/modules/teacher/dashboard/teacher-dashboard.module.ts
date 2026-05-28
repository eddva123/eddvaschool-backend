import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeacherProfile } from '../../../database/entities/teacher.entity';
import { Assignment } from '../../../assignments/entities/assignment.entity';
import { AttendanceRecord } from '../../../database/entities/attendance.entity';
import { Announcement } from '../../../database/entities/announcement.entity';
import { TeacherAnnouncementService } from '../announcements/teacher-announcement.service';
import { TeacherDashboardService } from './teacher-dashboard.service';
import { TeacherCacheModule } from '../common/teacher-cache.module';
import { TeacherAnalyticsModule } from '../analytics/teacher-analytics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TeacherProfile, Assignment, AttendanceRecord, Announcement]),
    TeacherCacheModule,
    TeacherAnalyticsModule,
  ],
  providers: [TeacherDashboardService, TeacherAnnouncementService],
  exports: [TeacherDashboardService],
})
export class TeacherDashboardModule {}
