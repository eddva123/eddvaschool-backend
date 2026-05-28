import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assignment } from '../../../assignments/entities/assignment.entity';
import { AssignmentSubmission, AssignmentGrade } from '../../../database/entities/assignment-submission.entity';
import { AssignmentRubric } from '../../../database/entities/assignment-rubric.entity';
import { TeacherDataStore } from '../../../database/entities/teacher-data-store.entity';
import { TeacherAssignmentsController } from './teacher-assignments.controller';
import { TeacherAssignmentsService } from './teacher-assignments.service';
import { TeacherDataStoreService } from '../../compat/teacher-datastore.service';
import { TeacherCacheModule } from '../common/teacher-cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Assignment, AssignmentSubmission, AssignmentGrade, AssignmentRubric, TeacherDataStore]),
    TeacherCacheModule,
  ],
  controllers: [TeacherAssignmentsController],
  providers: [TeacherAssignmentsService, TeacherDataStoreService],
  exports: [TeacherAssignmentsService],
})
export class TeacherAssignmentsModule {}
