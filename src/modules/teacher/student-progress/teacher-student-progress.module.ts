import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeacherStudentProgressController } from './teacher-student-progress.controller';
import { TeacherStudentProgressService } from './teacher-student-progress.service';
import { TeacherCacheModule } from '../common/teacher-cache.module';
import { PerformanceProfile, WeakTopic } from '../../../database/entities/analytics.entity';
import { AttendanceRecord, AttendanceSession } from '../../../database/entities/attendance.entity';
import { AssignmentSubmission } from '../../../database/entities/assignment-submission.entity';
import { Student } from '../../../database/entities/student.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PerformanceProfile,
      WeakTopic,
      AttendanceRecord,
      AttendanceSession,
      AssignmentSubmission,
      Student,
    ]),
    TeacherCacheModule,
  ],
  controllers: [TeacherStudentProgressController],
  providers: [TeacherStudentProgressService],
  exports: [TeacherStudentProgressService],
})
export class TeacherStudentProgressModule {}
