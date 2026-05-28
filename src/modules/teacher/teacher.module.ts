import { Module } from '@nestjs/common';
import { TeacherAttendanceModule } from './attendance/teacher-attendance.module';
import { TeacherAssignmentsModule } from './assignments/teacher-assignments.module';
import { TeacherAnnouncementModule } from './announcements/teacher-announcement.module';
import { TeacherDashboardModule } from './dashboard/teacher-dashboard.module';
import { TeacherAnalyticsModule } from './analytics/teacher-analytics.module';
import { TeacherCreatorStudioModule } from './creator-studio/teacher-creator-studio.module';
import { TeacherLiveClassesModule } from './live-classes/teacher-live-classes.module';
import { TeacherAssessmentsModule } from './assessments/teacher-assessments.module';
import { TeacherQuestionBankModule } from './question-bank/teacher-question-bank.module';
import { TeacherStudentProgressModule } from './student-progress/teacher-student-progress.module';

/**
 * TeacherModule — root teacher domain module.
 *
 * Composes all isolated teacher domain submodules.
 * Exports each domain service so CompatModule can inject them
 * as pure delegation targets (no business logic lives in CompatService).
 */
@Module({
  imports: [
    TeacherAttendanceModule,
    TeacherAssignmentsModule,
    TeacherAnnouncementModule,
    TeacherDashboardModule,
    TeacherAnalyticsModule,
    TeacherCreatorStudioModule,
    TeacherLiveClassesModule,
    TeacherAssessmentsModule,
    TeacherQuestionBankModule,
    TeacherStudentProgressModule,
  ],
  exports: [
    TeacherAttendanceModule,
    TeacherAssignmentsModule,
    TeacherAnnouncementModule,
    TeacherDashboardModule,
    TeacherAnalyticsModule,
    TeacherCreatorStudioModule,
    TeacherLiveClassesModule,
    TeacherAssessmentsModule,
    TeacherQuestionBankModule,
    TeacherStudentProgressModule,
  ],
})
export class TeacherModule {}

