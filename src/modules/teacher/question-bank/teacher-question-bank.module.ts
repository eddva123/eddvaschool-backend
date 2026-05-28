import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question, QuestionOption } from '../../../database/entities/question.entity';
import { TeacherQuestionBankService } from './teacher-question-bank.service';
import { TeacherQuestionBankController } from './teacher-question-bank.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Question, QuestionOption]),
  ],
  controllers: [
    TeacherQuestionBankController,
  ],
  providers: [
    TeacherQuestionBankService,
  ],
  exports: [
    TeacherQuestionBankService,
  ],
})
export class TeacherQuestionBankModule {}
