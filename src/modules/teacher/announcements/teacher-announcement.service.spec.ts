import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TeacherAnnouncementService } from './teacher-announcement.service';
import { Announcement } from '../../../database/entities/announcement.entity';
import { TeacherCacheService } from '../common/teacher-cache.service';

const mockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  }),
});

const mockCacheService = () => ({
  formatKey: jest.fn().mockReturnValue('mock-key'),
  get: jest.fn(),
  set: jest.fn(),
});

describe('TeacherAnnouncementService', () => {
  let service: TeacherAnnouncementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeacherAnnouncementService,
        { provide: getRepositoryToken(Announcement), useFactory: mockRepository },
        { provide: TeacherCacheService, useFactory: mockCacheService },
      ],
    }).compile();

    service = module.get<TeacherAnnouncementService>(TeacherAnnouncementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
