import { Test, TestingModule } from '@nestjs/testing';
import { TeacherLiveClassesService } from './teacher-live-classes.service';
import { TeacherDataStoreService } from '../../compat/teacher-datastore.service';

const mockDataStoreService = () => ({
  getData: jest.fn().mockResolvedValue({ items: [] }),
  saveData: jest.fn(),
});

describe('TeacherLiveClassesService', () => {
  let service: TeacherLiveClassesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeacherLiveClassesService,
        { provide: TeacherDataStoreService, useFactory: mockDataStoreService },
      ],
    }).compile();

    service = module.get<TeacherLiveClassesService>(TeacherLiveClassesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
