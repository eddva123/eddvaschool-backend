import { Module } from '@nestjs/common';
import { TeacherAnalyticsController } from './teacher-analytics.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assignment } from '../../../assignments/entities/assignment.entity';
import { AssignmentSubmission, AssignmentGrade } from '../../../database/entities/assignment-submission.entity';
import { AttendanceRecord, AttendanceSession } from '../../../database/entities/attendance.entity';
import { TeacherAssessment, TeacherAssessmentResult, TeacherAssessmentSection } from '../../../database/entities/teacher-assessment.entity';
import { TeacherAssessmentAttempt, TeacherAssessmentAnswer } from '../../../database/entities/teacher-assessment-expansion.entity';
import { EngagementLog, PerformanceProfile } from '../../../database/entities/analytics.entity';
import { Student } from '../../../database/entities/student.entity';
import { TeacherAnalyticsService } from './teacher-analytics.service';
import { TeacherCacheModule } from '../common/teacher-cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Assignment,
      AssignmentSubmission,
      AssignmentGrade,
      AttendanceRecord,
      AttendanceSession,
      TeacherAssessment,
      TeacherAssessmentResult,
      TeacherAssessmentSection,
      TeacherAssessmentAttempt,
      TeacherAssessmentAnswer,
      EngagementLog,
      PerformanceProfile,
      Student
    ]),
    TeacherCacheModule,
  ],
  controllers: [TeacherAnalyticsController],
  providers: [TeacherAnalyticsService],
  exports: [TeacherAnalyticsService],
})
export class TeacherAnalyticsModule {}
