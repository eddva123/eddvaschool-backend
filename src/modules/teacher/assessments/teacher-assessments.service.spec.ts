import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TeacherAssessmentsService } from './teacher-assessments.service';
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

const mockRepository = () => ({
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn().mockResolvedValue(null),
  create: jest.fn(),
  save: jest.fn(),
});

describe('TeacherAssessmentsService', () => {
  let service: TeacherAssessmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeacherAssessmentsService,
        { provide: getRepositoryToken(TeacherAssessment), useFactory: mockRepository },
        { provide: getRepositoryToken(TeacherAssessmentSection), useFactory: mockRepository },
        { provide: getRepositoryToken(TeacherAssessmentResult), useFactory: mockRepository },
        { provide: getRepositoryToken(Student), useFactory: mockRepository },
        { provide: getRepositoryToken(Question), useFactory: mockRepository },
        { provide: getRepositoryToken(QuestionOption), useFactory: mockRepository },
        { provide: getRepositoryToken(TeacherAssessmentQuestion), useFactory: mockRepository },
        { provide: getRepositoryToken(TeacherAssessmentAttempt), useFactory: mockRepository },
        { provide: getRepositoryToken(TeacherAssessmentAnswer), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<TeacherAssessmentsService>(TeacherAssessmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
