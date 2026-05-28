import { Test, TestingModule } from '@nestjs/testing';
import { TeacherCreatorStudioService } from './teacher-creator-studio.service';
import { TeacherDataStoreService } from '../../compat/teacher-datastore.service';

const mockDataStoreService = () => ({
  getData: jest.fn().mockResolvedValue({ items: [] }),
  saveData: jest.fn(),
});

describe('TeacherCreatorStudioService', () => {
  let service: TeacherCreatorStudioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeacherCreatorStudioService,
        { provide: TeacherDataStoreService, useFactory: mockDataStoreService },
      ],
    }).compile();

    service = module.get<TeacherCreatorStudioService>(TeacherCreatorStudioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
