import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TeacherQuestionBankService } from './teacher-question-bank.service';
import { Question, QuestionOption } from '../../../database/entities/question.entity';

const mockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn().mockImplementation((dto) => dto),
  save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
  createQueryBuilder: jest.fn().mockReturnValue({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getMany: jest.fn().mockResolvedValue([]),
  }),
  manager: {
    transaction: jest.fn().mockImplementation((cb) => cb({
      delete: jest.fn(),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    })),
  },
});

describe('TeacherQuestionBankService', () => {
  let service: TeacherQuestionBankService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeacherQuestionBankService,
        { provide: getRepositoryToken(Question), useFactory: mockRepository },
        { provide: getRepositoryToken(QuestionOption), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<TeacherQuestionBankService>(TeacherQuestionBankService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
