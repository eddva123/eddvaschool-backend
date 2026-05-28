import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Assignment } from '../../../assignments/entities/assignment.entity';
import { AssignmentSubmission, AssignmentGrade } from '../../../database/entities/assignment-submission.entity';
import { AssignmentRubric } from '../../../database/entities/assignment-rubric.entity';
import { TeacherDataStoreService } from '../../compat/teacher-datastore.service';
import { TeacherCacheService } from '../common/teacher-cache.service';

@Injectable()
export class TeacherAssignmentsService {
  constructor(
    @InjectRepository(Assignment)
    private readonly assignmentRepo: Repository<Assignment>,
    @InjectRepository(AssignmentSubmission)
    private readonly submissionRepo: Repository<AssignmentSubmission>,
    @InjectRepository(AssignmentGrade)
    private readonly gradeRepo: Repository<AssignmentGrade>,
    @InjectRepository(AssignmentRubric)
    private readonly rubricRepo: Repository<AssignmentRubric>,
    private readonly dataStoreService: TeacherDataStoreService,
    private readonly cacheService: TeacherCacheService,
  ) {}

  // ── Single source of truth: assignment listing ────────────────────────────

  async getAssignments(user: any) {
    const tenantId = user?.tenantId;
    const startTime = Date.now();

    // Deterministic auto-publish check during fetch (lightweight scheduling)
    await this.processScheduledAssignments(tenantId);

    const items = await this.assignmentRepo.find({
      where: { tenantId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });

    const data = items.map(a => this.toAssignmentView(a));

    // Sync JSONB snapshot for hybrid cache
    await this.dataStoreService.saveData(tenantId, 'assignments', data, user?.id);

    this.logTiming('getAssignments', tenantId, user?.id, Date.now() - startTime);
    return { data };
  }

  async createAssignment(payload: Record<string, any>, user: any) {
    const tenantId = user?.tenantId;
    const startTime = Date.now();

    const assignment = this.assignmentRepo.create({
      tenantId,
      teacherId: user?.id,
      title: payload.title,
      type: payload.type || 'homework',
      classId: payload.class_id || payload.classId,
      className: payload.class_name || ('Class ' + (payload.class_id || '')),
      subjectId: payload.subject_id || payload.subjectId,
      subjectName: payload.subject_name || ('Subject ' + (payload.subject_id || '')),
      dueDate: payload.due_date || payload.dueDate,
      instructions: payload.instructions,
      description: payload.description || payload.instructions,
      maxMarks: Number(payload.max_marks || payload.maxMarks || 100),
      totalMarks: Number(payload.totalMarks || payload.max_marks || payload.maxMarks || 100),
      status: payload.status || 'DRAFT', // Default to DRAFT for Milestone 5 workflows
      publishAt: payload.publishAt ? new Date(payload.publishAt) : null,
      allowResubmission: payload.allowResubmission ?? false,
      maxAttempts: payload.maxAttempts ?? 1,
      rubricEnabled: payload.rubricEnabled ?? false,
      lateSubmissionAllowed: payload.lateSubmissionAllowed ?? false,
      latePenaltyPercentage: payload.latePenaltyPercentage ?? 0,
    });

    if (assignment.publishAt && assignment.publishAt > new Date()) {
      assignment.status = 'SCHEDULED';
    }

    const saved = await this.assignmentRepo.save(assignment);
    const view = this.toAssignmentView(saved);

    await this.refreshCache(tenantId, user?.id);

    this.logTiming('createAssignment', tenantId, user?.id, Date.now() - startTime);
    return { data: view };
  }

  async updateAssignmentStatus(id: string, status: string, user: any) {
    const tenantId = user?.tenantId;
    const assignment = await this.assignmentRepo.findOne({ where: { id, tenantId, deletedAt: IsNull() } });
    
    if (!assignment) throw new NotFoundException('Assignment not found');
    
    assignment.status = status;
    const saved = await this.assignmentRepo.save(assignment);
    
    await this.refreshCache(tenantId, user?.id);
    return { data: this.toAssignmentView(saved) };
  }

  async scheduleAssignment(id: string, publishAt: Date, user: any) {
    const tenantId = user?.tenantId;
    const assignment = await this.assignmentRepo.findOne({ where: { id, tenantId, deletedAt: IsNull() } });
    
    if (!assignment) throw new NotFoundException('Assignment not found');
    
    assignment.publishAt = new Date(publishAt);
    assignment.status = assignment.publishAt > new Date() ? 'SCHEDULED' : 'PUBLISHED';
    
    const saved = await this.assignmentRepo.save(assignment);
    await this.refreshCache(tenantId, user?.id);
    return { data: this.toAssignmentView(saved) };
  }

  async deleteAssignment(id: string, currentUser?: any) {
    const startTime = Date.now();
    const tenantId = currentUser?.tenantId;

    const assignment = await this.assignmentRepo.findOne({
      where: { id, tenantId, deletedAt: IsNull() },
    });

    if (!assignment) {
      throw new NotFoundException(`Assignment ${id} not found`);
    }

    await this.assignmentRepo.softDelete({ id });
    await this.refreshCache(tenantId, currentUser?.id);

    this.logTiming('deleteAssignment', tenantId, currentUser?.id, Date.now() - startTime);
    return { success: true };
  }

  // ── Scheduled Publishing ──────────────────────────────────────────────────
  private async processScheduledAssignments(tenantId: string) {
    const now = new Date();
    // Lightweight deterministic pattern: fetch scheduled assignments past their publish date and activate them
    const scheduled = await this.assignmentRepo.createQueryBuilder('a')
      .where('a.tenant_id = :tenantId', { tenantId })
      .andWhere('a.status = :status', { status: 'SCHEDULED' })
      .andWhere('a.publish_at <= :now', { now })
      .getMany();

    if (scheduled.length > 0) {
      for (const a of scheduled) {
        a.status = 'PUBLISHED';
      }
      await this.assignmentRepo.save(scheduled);
    }
  }

  // ── Rubrics ───────────────────────────────────────────────────────────────

  async setRubric(assignmentId: string, criteria: any[], user: any) {
    const tenantId = user?.tenantId;
    
    // Clear existing
    await this.rubricRepo.delete({ assignmentId, tenantId });
    
    const rubrics = criteria.map(c => this.rubricRepo.create({
      tenantId,
      assignmentId,
      criterion: c.criterion,
      maxScore: c.maxScore || 10,
      weight: c.weight || 100,
      description: c.description,
    }));
    
    const saved = await this.rubricRepo.save(rubrics);
    
    // update assignment to have rubric enabled
    await this.assignmentRepo.update({ id: assignmentId, tenantId }, { rubricEnabled: true });
    
    return { data: saved };
  }

  async getRubric(assignmentId: string, user: any) {
    const tenantId = user?.tenantId;
    const rubrics = await this.rubricRepo.find({ where: { assignmentId, tenantId } });
    return { data: rubrics };
  }

  // ── Submission tracking ──────────────────────────────────────────────────

  async getSubmissions(assignmentId: string, user: any) {
    const tenantId = user?.tenantId;
    const submissions = await this.submissionRepo.find({
      where: { assignmentId, tenantId, deletedAt: IsNull() },
      order: { submittedAt: 'DESC' },
    });
    return { data: submissions };
  }

  async submitAssignment(assignmentId: string, payload: Record<string, any>, user: any) {
    const tenantId = user?.tenantId;
    
    const assignment = await this.assignmentRepo.findOne({ where: { id: assignmentId, tenantId } });
    if (!assignment) throw new NotFoundException('Assignment not found');

    // Calculate late submission flag
    let isLateSubmission = false;
    if (assignment.dueDate) {
      const due = new Date(assignment.dueDate);
      if (new Date() > due) {
        if (!assignment.lateSubmissionAllowed) {
          throw new BadRequestException('Late submissions are not allowed for this assignment');
        }
        isLateSubmission = true;
      }
    }

    // Determine attempt number
    const previousAttempts = await this.submissionRepo.count({ where: { assignmentId, studentId: user?.id || payload.studentId, tenantId } });
    if (previousAttempts >= assignment.maxAttempts && !assignment.allowResubmission) {
       throw new BadRequestException('Maximum attempts reached');
    }

    const submission = this.submissionRepo.create({
      tenantId,
      assignmentId,
      studentId: user?.id || payload.studentId,
      status: isLateSubmission ? 'late' : 'submitted',
      attachmentUrl: payload.attachmentUrl,
      studentNotes: payload.notes || payload.studentNotes,
      isLateSubmission,
      attemptNumber: previousAttempts + 1,
      attachmentPreviewMetadata: payload.attachmentPreviewMetadata || null,
    });
    const saved = await this.submissionRepo.save(submission);
    return { data: saved };
  }

  async gradeSubmission(submissionId: string, payload: Record<string, any>, user: any) {
    const tenantId = user?.tenantId;
    
    const submission = await this.submissionRepo.findOne({ where: { id: submissionId, tenantId }, relations: ['assignment'] });
    if (!submission) throw new NotFoundException('Submission not found');
    
    let gradeRecord = await this.gradeRepo.findOne({
      where: { submissionId, tenantId, deletedAt: IsNull() },
    });

    let finalScore = Number(payload.score || 0);
    
    // Process rubric if provided
    if (payload.rubricBreakdown && submission.assignment?.rubricEnabled) {
      // Sum up rubric scores
      finalScore = (Object.values(payload.rubricBreakdown) as number[]).reduce((sum: number, score: number) => sum + Number(score), 0);
    }
    
    // Apply late penalty if applicable
    if (submission.isLateSubmission && submission.assignment?.latePenaltyPercentage > 0) {
      const penalty = finalScore * (submission.assignment.latePenaltyPercentage / 100);
      finalScore = Math.max(0, finalScore - penalty);
    }

    if (gradeRecord) {
      gradeRecord.grade = payload.grade;
      gradeRecord.score = finalScore;
      gradeRecord.remarks = payload.remarks;
      gradeRecord.rubricBreakdown = payload.rubricBreakdown || null;
      gradeRecord.gradedBy = user?.id || 'teacher';
    } else {
      gradeRecord = this.gradeRepo.create({
        tenantId,
        submissionId,
        grade: payload.grade,
        score: finalScore,
        gradedBy: user?.id || 'teacher',
        remarks: payload.remarks,
        rubricBreakdown: payload.rubricBreakdown || null,
      });
    }

    const savedGrade = await this.gradeRepo.save(gradeRecord);
    
    // Update submission with teacher feedback summary
    if (payload.feedbackSummary) {
      submission.feedbackSummary = payload.feedbackSummary;
      submission.teacherRemarks = payload.remarks;
      await this.submissionRepo.save(submission);
    }
    
    return { data: savedGrade };
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private async refreshCache(tenantId: string, userId: string) {
    const remaining = await this.assignmentRepo.find({
      where: { tenantId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
    await this.dataStoreService.saveData(tenantId, 'assignments', remaining.map(a => this.toAssignmentView(a)), userId);

    if (userId) {
      const cacheKey = this.cacheService.formatKey(tenantId, 'dashboard', userId);
      await this.cacheService.invalidate(cacheKey);
    }
  }

  private toAssignmentView(a: Assignment) {
    return {
      id: a.id,
      tenantId: a.tenantId,
      title: a.title,
      type: a.type,
      class_id: a.classId,
      class_name: a.className,
      subject_id: a.subjectId,
      subject_name: a.subjectName,
      due_date: a.dueDate,
      instructions: a.instructions || a.description,
      status: a.status,
      publishAt: a.publishAt,
      createdAt: a.createdAt,
      allowResubmission: a.allowResubmission,
      maxAttempts: a.maxAttempts,
      rubricEnabled: a.rubricEnabled,
      totalMarks: a.totalMarks || a.maxMarks,
    };
  }

  private logTiming(action: string, tenantId: string, userId: string, ms: number) {
    console.log(`[OBSERVABILITY] [${new Date().toISOString()}] Module: TeacherAssignments | Action: ${action} | Tenant: ${tenantId} | User: ${userId} | Duration: ${ms}ms`);
  }
}
