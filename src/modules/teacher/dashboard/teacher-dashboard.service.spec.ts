import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TeacherDashboardService } from './teacher-dashboard.service';
import { TeacherProfile } from '../../../database/entities/teacher.entity';
import { Assignment } from '../../../assignments/entities/assignment.entity';
import { AttendanceRecord } from '../../../database/entities/attendance.entity';
import { TeacherAnnouncementService } from '../announcements/teacher-announcement.service';
import { TeacherCacheService } from '../common/teacher-cache.service';
import { TeacherAnalyticsService } from '../analytics/teacher-analytics.service';

const mockRepository = () => ({
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn().mockResolvedValue(null),
});

const mockDataSource = () => ({
  getRepository: jest.fn().mockReturnValue({
    find: jest.fn().mockResolvedValue([]),
  }),
  createQueryBuilder: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(0),
  }),
  query: jest.fn().mockResolvedValue([]),
});

const mockAnnouncementService = () => ({
  getDashboardAnnouncements: jest.fn().mockResolvedValue([]),
});

const mockCacheService = () => ({
  formatKey: jest.fn().mockReturnValue('mock-key'),
  get: jest.fn(),
  set: jest.fn(),
});

describe('TeacherDashboardService', () => {
  let service: TeacherDashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeacherDashboardService,
        { provide: DataSource, useFactory: mockDataSource },
        { provide: getRepositoryToken(TeacherProfile), useFactory: mockRepository },
        { provide: getRepositoryToken(Assignment), useFactory: mockRepository },
        { provide: getRepositoryToken(AttendanceRecord), useFactory: mockRepository },
        { provide: TeacherAnnouncementService, useFactory: mockAnnouncementService },
        { provide: TeacherCacheService, useFactory: mockCacheService },
        { 
          provide: TeacherAnalyticsService, 
          useValue: { 
            getAssessmentPerformanceSummary: jest.fn().mockResolvedValue({}),
            getEngagementMetrics: jest.fn().mockResolvedValue({}) 
          } 
        },
      ],
    }).compile();

    service = module.get<TeacherDashboardService>(TeacherDashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
