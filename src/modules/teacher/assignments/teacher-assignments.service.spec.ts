import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TeacherAssignmentsService } from './teacher-assignments.service';
import { Assignment } from '../../../assignments/entities/assignment.entity';
import { AssignmentSubmission, AssignmentGrade } from '../../../database/entities/assignment-submission.entity';
import { AssignmentRubric } from '../../../database/entities/assignment-rubric.entity';
import { TeacherDataStoreService } from '../../compat/teacher-datastore.service';
import { TeacherCacheService } from '../common/teacher-cache.service';
import { BadRequestException } from '@nestjs/common';

const mockQueryBuilder = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue([]),
};

const mockRepository = () => ({
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn(),
  create: jest.fn().mockImplementation(dto => dto),
  save: jest.fn().mockImplementation(entity => Promise.resolve({ id: 'mock-id', ...entity })),
  softDelete: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
  count: jest.fn().mockResolvedValue(0),
  createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
});

const mockDataStoreService = () => ({
  saveData: jest.fn(),
});

const mockCacheService = () => ({
  formatKey: jest.fn().mockReturnValue('mock-key'),
  invalidate: jest.fn(),
});

describe('TeacherAssignmentsService', () => {
  let service: TeacherAssignmentsService;
  let assignmentRepo: any;
  let submissionRepo: any;
  let gradeRepo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeacherAssignmentsService,
        { provide: getRepositoryToken(Assignment), useFactory: mockRepository },
        { provide: getRepositoryToken(AssignmentSubmission), useFactory: mockRepository },
        { provide: getRepositoryToken(AssignmentGrade), useFactory: mockRepository },
        { provide: getRepositoryToken(AssignmentRubric), useFactory: mockRepository },
        { provide: TeacherDataStoreService, useFactory: mockDataStoreService },
        { provide: TeacherCacheService, useFactory: mockCacheService },
      ],
    }).compile();

    service = module.get<TeacherAssignmentsService>(TeacherAssignmentsService);
    assignmentRepo = module.get(getRepositoryToken(Assignment));
    submissionRepo = module.get(getRepositoryToken(AssignmentSubmission));
    gradeRepo = module.get(getRepositoryToken(AssignmentGrade));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAssignment & scheduleAssignment', () => {
    it('should set status to SCHEDULED if publishAt is in the future', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      
      const result = await service.createAssignment({
        title: 'Future Task',
        publishAt: futureDate.toISOString()
      }, { tenantId: 't1' });
      
      expect(result.data.status).toBe('SCHEDULED');
      expect(assignmentRepo.save).toHaveBeenCalled();
    });
  });

  describe('submitAssignment', () => {
    it('should mark submission as late if past due date', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      assignmentRepo.findOne.mockResolvedValue({
        id: 'a1',
        dueDate: pastDate.toISOString(),
        lateSubmissionAllowed: true,
        maxAttempts: 1
      });

      const result = await service.submitAssignment('a1', {}, { tenantId: 't1' });
      expect(result.data.isLateSubmission).toBe(true);
      expect(result.data.status).toBe('late');
    });

    it('should throw error if late submission is not allowed', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      assignmentRepo.findOne.mockResolvedValue({
        id: 'a1',
        dueDate: pastDate.toISOString(),
        lateSubmissionAllowed: false
      });

      await expect(service.submitAssignment('a1', {}, { tenantId: 't1' }))
        .rejects.toThrow(BadRequestException);
    });

    it('should track attempt number and throw if max attempts reached', async () => {
      assignmentRepo.findOne.mockResolvedValue({
        id: 'a1',
        maxAttempts: 1,
        allowResubmission: false
      });
      submissionRepo.count.mockResolvedValue(1);

      await expect(service.submitAssignment('a1', {}, { tenantId: 't1' }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('gradeSubmission', () => {
    it('should apply rubric breakdown and late penalty', async () => {
      submissionRepo.findOne.mockResolvedValue({
        id: 's1',
        isLateSubmission: true,
        assignment: {
          rubricEnabled: true,
          latePenaltyPercentage: 10
        }
      });
      gradeRepo.findOne.mockResolvedValue(null);

      const payload = {
        grade: 'A',
        rubricBreakdown: { 'Accuracy': 50, 'Style': 50 } // total 100
      };

      const result = await service.gradeSubmission('s1', payload, { tenantId: 't1' });
      
      // 100 - 10% penalty = 90
      expect(result.data.score).toBe(90);
      expect(result.data.rubricBreakdown).toEqual(payload.rubricBreakdown);
    });
  });
});
