import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TeacherAnalyticsService } from './teacher-analytics.service';
import { Assignment } from '../../../assignments/entities/assignment.entity';
import { AssignmentSubmission, AssignmentGrade } from '../../../database/entities/assignment-submission.entity';
import { AttendanceRecord } from '../../../database/entities/attendance.entity';
import { TeacherAssessmentResult, TeacherAssessmentSection } from '../../../database/entities/teacher-assessment.entity';
import { TeacherAssessmentAnswer } from '../../../database/entities/teacher-assessment-expansion.entity';
import { EngagementLog, PerformanceProfile } from '../../../database/entities/analytics.entity';
import { Student } from '../../../database/entities/student.entity';
import { TeacherCacheService } from '../common/teacher-cache.service';

const mockQueryBuilder = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  getRawOne: jest.fn(),
  getRawMany: jest.fn(),
  getCount: jest.fn(),
};

const mockRepository = () => ({
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
});

const mockCacheService = () => ({
  formatKey: jest.fn((t, m, k) => `${t}:${m}:${k}`),
  get: jest.fn(),
  set: jest.fn(),
});

describe('TeacherAnalyticsService', () => {
  let service: TeacherAnalyticsService;
  let cacheService: ReturnType<typeof mockCacheService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeacherAnalyticsService,
        { provide: getRepositoryToken(Assignment), useFactory: mockRepository },
        { provide: getRepositoryToken(AssignmentSubmission), useFactory: mockRepository },
        { provide: getRepositoryToken(AssignmentGrade), useFactory: mockRepository },
        { provide: getRepositoryToken(AttendanceRecord), useFactory: mockRepository },
        { provide: getRepositoryToken(TeacherAssessmentResult), useFactory: mockRepository },
        { provide: getRepositoryToken(TeacherAssessmentAnswer), useFactory: mockRepository },
        { provide: getRepositoryToken(TeacherAssessmentSection), useFactory: mockRepository },
        { provide: getRepositoryToken(EngagementLog), useFactory: mockRepository },
        { provide: getRepositoryToken(PerformanceProfile), useFactory: mockRepository },
        { provide: getRepositoryToken(Student), useFactory: mockRepository },
        { provide: TeacherCacheService, useFactory: mockCacheService },
      ],
    }).compile();

    service = module.get<TeacherAnalyticsService>(TeacherAnalyticsService);
    cacheService = module.get(TeacherCacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAssessmentPerformanceSummary', () => {
    it('should return cached result if available', async () => {
      cacheService.get.mockResolvedValue({ averageScore: 85, passRate: 90 });
      const result = await service.getAssessmentPerformanceSummary('tenant-1', 'assessment-1');
      expect(result).toEqual({ averageScore: 85, passRate: 90 });
      expect(cacheService.get).toHaveBeenCalled();
      expect(mockQueryBuilder.getRawOne).not.toHaveBeenCalled();
    });

    it('should query DB and format response if not cached', async () => {
      cacheService.get.mockResolvedValue(null);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        averageScore: '80.5',
        highestScore: '95',
        lowestScore: '40',
        totalAttempts: '10'
      });
      mockQueryBuilder.getCount.mockResolvedValue(8);

      const result = await service.getAssessmentPerformanceSummary('tenant-1', 'assessment-1');
      
      expect(result.averageScore).toBe(80.5);
      expect(result.highestScore).toBe(95);
      expect(result.lowestScore).toBe(40);
      expect(result.totalAttempts).toBe(10);
      expect(result.passRate).toBe(80); // (8 / 10) * 100

      expect(cacheService.set).toHaveBeenCalledWith(
        'tenant-1:analytics:assessment_summary:assessment-1',
        result,
        300000
      );
    });
  });

  describe('getQuestionDifficultyAnalytics', () => {
    it('should deterministically classify difficulty', async () => {
      cacheService.get.mockResolvedValue(null);
      mockQueryBuilder.getRawMany.mockResolvedValue([
        { questionId: 'q1', totalAttempts: '10', correctAttempts: '9', averageTimeSpent: '30' }, // 90% (EASY)
        { questionId: 'q2', totalAttempts: '10', correctAttempts: '5', averageTimeSpent: '45' }, // 50% (MEDIUM)
        { questionId: 'q3', totalAttempts: '10', correctAttempts: '2', averageTimeSpent: '60' }, // 20% (HARD)
      ]);

      const result = await service.getQuestionDifficultyAnalytics('tenant-1');
      
      expect(result.length).toBe(3);
      expect(result[0].difficulty).toBe('EASY');
      expect(result[1].difficulty).toBe('MEDIUM');
      expect(result[2].difficulty).toBe('HARD');

      expect(cacheService.set).toHaveBeenCalledWith(
        'tenant-1:analytics:question_difficulty',
        result,
        600000
      );
    });
  });
});
