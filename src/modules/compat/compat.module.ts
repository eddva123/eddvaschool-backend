import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Announcement } from '../../database/entities/announcement.entity';
import { Enrollment } from '../../database/entities/batch.entity';
import { Student } from '../../database/entities/student.entity';
import { Tenant } from '../../database/entities/tenant.entity';
import { TeacherProfile } from '../../database/entities/teacher.entity';
import { User } from '../../database/entities/user.entity';
import { Complaint } from '../../database/entities/complaint.entity';
import { TeacherDataStore } from '../../database/entities/teacher-data-store.entity';
import { AttendanceSession, AttendanceRecord } from '../../database/entities/attendance.entity';
import { Assignment } from '../../assignments/entities/assignment.entity';
import { AssignmentSubmission, AssignmentGrade } from '../../database/entities/assignment-submission.entity';
import { TeacherAssessment, TeacherAssessmentSection, TeacherAssessmentResult } from '../../database/entities/teacher-assessment.entity';
import { CompatController } from './compat.controller';
import { CompatService } from './compat.service';
import { TeacherDataStoreService } from './teacher-datastore.service';
import { TeacherModule } from '../teacher/teacher.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tenant, User, Announcement, Enrollment, Student, TeacherProfile, Complaint, TeacherDataStore,
      AttendanceSession, AttendanceRecord, Assignment, AssignmentSubmission, AssignmentGrade,
      TeacherAssessment, TeacherAssessmentSection, TeacherAssessmentResult,
    ]),
    TeacherModule,
  ],
  controllers: [CompatController],
  providers: [CompatService, TeacherDataStoreService],
  exports: [TeacherDataStoreService],
})
export class CompatModule {}