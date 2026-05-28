import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TeacherAttendanceService } from './teacher-attendance.service';
import { AttendanceSession, AttendanceRecord } from '../../../database/entities/attendance.entity';
import { Student } from '../../../database/entities/student.entity';
import { TeacherDataStoreService } from '../../compat/teacher-datastore.service';
import { TeacherCacheService } from '../common/teacher-cache.service';

const mockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockDataStoreService = () => ({
  getData: jest.fn(),
  saveData: jest.fn(),
});

const mockCacheService = () => ({
  formatKey: jest.fn().mockReturnValue('mock-key'),
  get: jest.fn(),
  set: jest.fn(),
  invalidate: jest.fn(),
});

describe('TeacherAttendanceService', () => {
  let service: TeacherAttendanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeacherAttendanceService,
        { provide: getRepositoryToken(AttendanceSession), useFactory: mockRepository },
        { provide: getRepositoryToken(AttendanceRecord), useFactory: mockRepository },
        { provide: getRepositoryToken(Student), useFactory: mockRepository },
        { provide: TeacherDataStoreService, useFactory: mockDataStoreService },
        { provide: TeacherCacheService, useFactory: mockCacheService },
      ],
    }).compile();

    service = module.get<TeacherAttendanceService>(TeacherAttendanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
