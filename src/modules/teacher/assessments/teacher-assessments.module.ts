import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  TeacherAssessment,
  TeacherAssessmentSection,
  TeacherAssessmentResult,
} from '../../../database/entities/teacher-assessment.entity';
import { Student } from '../../../database/entities/student.entity';
import { Question, QuestionOption } from '../../../database/entities/question.entity';
import {
  TeacherAssessmentQuestion,
  TeacherAssessmentAttempt,
  TeacherAssessmentAnswer,
} from '../../../database/entities/teacher-assessment-expansion.entity';
import { TeacherAssessmentsService } from './teacher-assessments.service';
import { TeacherAssessmentsController } from './teacher-assessments.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TeacherAssessment,
      TeacherAssessmentSection,
      TeacherAssessmentResult,
      Student,
      Question,
      QuestionOption,
      TeacherAssessmentQuestion,
      TeacherAssessmentAttempt,
      TeacherAssessmentAnswer,
    ]),
  ],
  controllers: [TeacherAssessmentsController],
  providers: [TeacherAssessmentsService],
  exports: [TeacherAssessmentsService],
})
export class TeacherAssessmentsModule {}
