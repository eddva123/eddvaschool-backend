import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
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
import { AddAssessmentQuestionDto, SubmitAttemptDto } from './dto/assessment-question.dto';

@Injectable()
export class TeacherAssessmentsService {
  constructor(
    @InjectRepository(TeacherAssessment)
    private readonly assessmentRepo: Repository<TeacherAssessment>,
    @InjectRepository(TeacherAssessmentSection)
    private readonly sectionRepo: Repository<TeacherAssessmentSection>,
    @InjectRepository(TeacherAssessmentResult)
    private readonly resultRepo: Repository<TeacherAssessmentResult>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
    @InjectRepository(QuestionOption)
    private readonly optionRepo: Repository<QuestionOption>,
    @InjectRepository(TeacherAssessmentQuestion)
    private readonly taQuestionRepo: Repository<TeacherAssessmentQuestion>,
    @InjectRepository(TeacherAssessmentAttempt)
    private readonly taAttemptRepo: Repository<TeacherAssessmentAttempt>,
    @InjectRepository(TeacherAssessmentAnswer)
    private readonly taAnswerRepo: Repository<TeacherAssessmentAnswer>,
  ) {}

  // ── Single source of truth: teacher-created assessments ─────────────────

  async getAssessments(user: any) {
    const tenantId = user?.tenantId;
    const startTime = Date.now();

    const items = await this.assessmentRepo.find({
      where: { tenantId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });

    this.logTiming('getAssessments', tenantId, user?.id, Date.now() - startTime);
    return { data: items };
  }

  async createAssessment(payload: Record<string, any>, user: any) {
    const tenantId = user?.tenantId;
    const assessment = this.assessmentRepo.create({
      tenantId,
      teacherId: user?.id,
      title: payload.title,
      description: payload.description,
      type: payload.type || 'quiz',
      totalMarks: Number(payload.totalMarks || payload.total_marks || 100),
      durationMinutes: payload.durationMinutes !== undefined ? Number(payload.durationMinutes) : undefined,
      passingMarks: payload.passingMarks !== undefined ? Number(payload.passingMarks) : undefined,
      shuffleQuestions: !!payload.shuffleQuestions,
      showAnswersAfterSubmit: payload.showAnswersAfterSubmit !== undefined ? !!payload.showAnswersAfterSubmit : true,
      allowReattempt: !!payload.allowReattempt,
      status: 'draft',
    });

    const saved = await this.assessmentRepo.save(assessment);
    this.logTiming('createAssessment', tenantId, user?.id, 0);
    return { data: saved };
  }

  async getAssessmentById(id: string, user: any) {
    const tenantId = user?.tenantId;
    const assessment = await this.assessmentRepo.findOne({
      where: { id, tenantId, deletedAt: IsNull() },
    });
    if (!assessment) throw new NotFoundException(`Assessment ${id} not found`);

    const sections = await this.sectionRepo.find({
      where: { assessmentId: id, deletedAt: IsNull() },
      order: { order: 'ASC' },
    });

    return { data: { ...assessment, sections } };
  }

  async createSection(assessmentId: string, payload: Record<string, any>, user: any) {
    const section = this.sectionRepo.create({
      assessmentId,
      title: payload.title,
      order: Number(payload.order || 0),
    });
    const saved = await this.sectionRepo.save(section);
    return { data: saved };
  }

  async getResults(assessmentId: string, user: any) {
    const tenantId = user?.tenantId;
    const results = await this.resultRepo.find({
      where: { assessmentId, tenantId, deletedAt: IsNull() },
      order: { score: 'DESC' },
    });
    return { data: results };
  }

  async recordResult(assessmentId: string, payload: Record<string, any>, user: any) {
    const tenantId = user?.tenantId;
    const result = this.resultRepo.create({
      tenantId,
      assessmentId,
      studentId: payload.studentId,
      score: Number(payload.score || 0),
      percentage: Number(payload.percentage || 0),
      gradedBy: user?.id,
      remarks: payload.remarks,
    });
    const saved = await this.resultRepo.save(result);
    return { data: saved };
  }

  async getLeaderboard(id: string) {
    const results = await this.resultRepo.find({
      where: { assessmentId: id, deletedAt: IsNull() },
      order: { score: 'DESC' },
    });

    const studentIds = results.map(r => r.studentId).filter(Boolean);
    const students = studentIds.length > 0 ? await this.studentRepo.find({
      where: { id: In(studentIds) },
      relations: ['user'],
    }) : [];

    const studentLookup = new Map(students.map(s => [s.id, s]));

    const data = results.map(r => {
      const student = studentLookup.get(r.studentId);
      return {
        student_name: student?.user?.fullName || 'Student',
        class_name: student?.class ? `Class ${student.class}` : '12-A',
        marks_obtained: r.score,
        percentage: r.percentage || Math.round((r.score / 100) * 100),
      };
    });

    return { data };
  }

  async getAnalytics(id: string) {
    const results = await this.resultRepo.find({
      where: { assessmentId: id, deletedAt: IsNull() },
    });

    const total = results.length;
    if (total === 0) {
      return {
        data: {
          averageScore: 0,
          highestScore: 0,
          passRate: 0,
          distinctionRate: 0,
          gradeDistribution: [
            { grade: 'A', count: 0, color: '#4ade80' },
            { grade: 'B', count: 0, color: '#3b82f6' },
            { grade: 'C', count: 0, color: '#f59e0b' },
            { grade: 'D', count: 0, color: '#ef4444' },
            { grade: 'F', count: 0, color: '#94a3b8' },
          ],
        },
      };
    }

    const scores = results.map(r => r.score);
    const sum = scores.reduce((a, b) => a + b, 0);
    const averageScore = Math.round(sum / total);
    const highestScore = Math.max(...scores);

    const passed = results.filter(r => (r.percentage || 0) >= 40).length;
    const passRate = Math.round((passed / total) * 100);

    const distinction = results.filter(r => (r.percentage || 0) >= 75).length;
    const distinctionRate = Math.round((distinction / total) * 100);

    const gradeCounts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    results.forEach(r => {
      const p = r.percentage || 0;
      if (p >= 85) gradeCounts.A++;
      else if (p >= 70) gradeCounts.B++;
      else if (p >= 55) gradeCounts.C++;
      else if (p >= 40) gradeCounts.D++;
      else gradeCounts.F++;
    });

    const gradeDistribution = [
      { grade: 'A', count: gradeCounts.A, color: '#4ade80' },
      { grade: 'B', count: gradeCounts.B, color: '#3b82f6' },
      { grade: 'C', count: gradeCounts.C, color: '#f59e0b' },
      { grade: 'D', count: gradeCounts.D, color: '#ef4444' },
      { grade: 'F', count: gradeCounts.F, color: '#94a3b8' },
    ];

    return {
      data: {
        averageScore,
        highestScore,
        passRate,
        distinctionRate,
        gradeDistribution,
      },
    };
  }

  async publishAssessment(id: string, user: any) {
    const tenantId = user?.tenantId;
    const assessment = await this.assessmentRepo.findOne({
      where: { id, tenantId, deletedAt: IsNull() },
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment ${id} not found`);
    }

    assessment.status = 'published';
    const saved = await this.assessmentRepo.save(assessment);
    return { data: saved };
  }

  // ── Advanced Timed & Linked Assessments (Milestone 2) ──────────────────

  async addQuestion(assessmentId: string, dto: AddAssessmentQuestionDto, user: any) {
    const tenantId = user?.tenantId;
    const assessment = await this.assessmentRepo.findOne({ where: { id: assessmentId, tenantId, deletedAt: IsNull() } });
    if (!assessment) throw new NotFoundException(`Assessment ${assessmentId} not found`);

    const question = await this.questionRepo.findOne({ where: { id: dto.questionId, isActive: true } });
    if (!question) throw new NotFoundException(`Question ${dto.questionId} not found`);

    if (dto.sectionId) {
      const section = await this.sectionRepo.findOne({ where: { id: dto.sectionId, assessmentId, deletedAt: IsNull() } });
      if (!section) throw new NotFoundException(`Section ${dto.sectionId} not found in assessment`);
    }

    const junction = this.taQuestionRepo.create({
      tenantId,
      assessmentId,
      questionId: dto.questionId,
      sectionId: dto.sectionId || null,
      order: dto.order ?? 0,
      marksCorrect: dto.marksCorrect ?? question.marksCorrect,
      marksWrong: dto.marksWrong ?? question.marksWrong,
    });

    const saved = await this.taQuestionRepo.save(junction);
    return { data: saved };
  }

  async removeQuestion(assessmentId: string, questionId: string, user: any) {
    const tenantId = user?.tenantId;
    const junction = await this.taQuestionRepo.findOne({
      where: { assessmentId, questionId, tenantId }
    });
    if (!junction) {
      throw new NotFoundException(`Question ${questionId} is not linked to assessment ${assessmentId}`);
    }
    await this.taQuestionRepo.remove(junction);
    return { success: true };
  }

  async getAssessmentQuestions(assessmentId: string, user: any) {
    const tenantId = user?.tenantId;
    const questions = await this.taQuestionRepo.find({
      where: { assessmentId, tenantId },
      relations: ['question', 'question.options'],
      order: { order: 'ASC', createdAt: 'ASC' }
    });
    return { data: questions };
  }

  async startAttempt(assessmentId: string, studentIdOrUserId: string, tenantId: string) {
    let student = await this.studentRepo.findOne({ where: { id: studentIdOrUserId, tenantId } });
    if (!student) {
      student = await this.studentRepo.findOne({ where: { userId: studentIdOrUserId, tenantId } });
    }
    if (!student) {
      throw new NotFoundException(`Student profile not found for identifier ${studentIdOrUserId}`);
    }

    const assessment = await this.assessmentRepo.findOne({ where: { id: assessmentId, tenantId, deletedAt: IsNull() } });
    if (!assessment) throw new NotFoundException(`Assessment ${assessmentId} not found`);

    if (!assessment.allowReattempt) {
      const existing = await this.taAttemptRepo.findOne({
        where: { assessmentId, studentId: student.id, tenantId, status: In(['submitted', 'auto_submitted']) }
      });
      if (existing) {
        throw new Error('Reattempt is not allowed for this assessment.');
      }
    }

    const attempt = this.taAttemptRepo.create({
      tenantId,
      assessmentId,
      studentId: student.id,
      startedAt: new Date(),
      status: 'in_progress',
      totalScore: 0,
      percentage: 0,
      timeTakenSeconds: 0,
      autoGraded: false,
    });

    const saved = await this.taAttemptRepo.save(attempt);
    return { data: saved };
  }

  async submitAttempt(attemptId: string, dto: SubmitAttemptDto, tenantId: string) {
    const attempt = await this.taAttemptRepo.findOne({
      where: { id: attemptId, tenantId, status: 'in_progress' }
    });
    if (!attempt) {
      throw new NotFoundException(`In-progress attempt with ID ${attemptId} not found.`);
    }

    const assessment = await this.assessmentRepo.findOne({
      where: { id: attempt.assessmentId, tenantId }
    });
    if (!assessment) throw new NotFoundException('Assessment not found');

    const linkedQuestions = await this.taQuestionRepo.find({
      where: { assessmentId: attempt.assessmentId, tenantId },
      relations: ['question', 'question.options']
    });

    const submittedAnswers = dto.answers || [];
    let totalScore = 0;
    let totalMaxMarks = 0;

    const answerEntities: TeacherAssessmentAnswer[] = [];

    for (const link of linkedQuestions) {
      const q = link.question;
      const subAnswer = submittedAnswers.find(ans => ans.questionId === link.questionId);

      const maxCorrectMarks = link.marksCorrect !== null && link.marksCorrect !== undefined ? link.marksCorrect : (q.marksCorrect ?? 4);
      const wrongMarks = link.marksWrong !== null && link.marksWrong !== undefined ? link.marksWrong : (q.marksWrong ?? -1);

      totalMaxMarks += maxCorrectMarks;

      let isCorrect: boolean | null = null;
      let marksAwarded = 0;
      let selectedOptionIds: string[] = [];
      let integerAnswer: string | null = null;
      let descriptiveAnswer: string | null = null;
      let timeSpentSeconds = 0;

      if (subAnswer) {
        selectedOptionIds = subAnswer.selectedOptionIds ?? [];
        integerAnswer = subAnswer.integerAnswer ?? null;
        descriptiveAnswer = subAnswer.descriptiveAnswer ?? null;
        timeSpentSeconds = subAnswer.timeSpentSeconds ?? 0;

        if (q.type === 'mcq_single' || q.type === 'mcq_multi') {
          const correctOptionIds = q.options.filter(o => o.isCorrect).map(o => o.id);
          const selectedSet = new Set(selectedOptionIds);
          const correctSet = new Set(correctOptionIds);

          const allCorrectSelected = correctOptionIds.every(id => selectedSet.has(id));
          const noIncorrectSelected = selectedOptionIds.every(id => correctSet.has(id));

          isCorrect = allCorrectSelected && noIncorrectSelected && selectedOptionIds.length > 0;
          marksAwarded = isCorrect ? maxCorrectMarks : wrongMarks;
        } else if (q.type === 'integer') {
          isCorrect = q.integerAnswer?.trim() === integerAnswer?.trim();
          marksAwarded = isCorrect ? maxCorrectMarks : wrongMarks;
        } else {
          isCorrect = null;
          marksAwarded = 0;
        }
      } else {
        isCorrect = false;
        marksAwarded = 0;
      }

      totalScore += marksAwarded;

      const answerEntity = this.taAnswerRepo.create({
        tenantId,
        attemptId,
        questionId: link.questionId,
        selectedOptionIds,
        integerAnswer,
        descriptiveAnswer,
        isCorrect,
        marksAwarded,
        timeSpentSeconds,
      });

      answerEntities.push(answerEntity);
    }

    await this.taAnswerRepo.save(answerEntities);

    const percentage = totalMaxMarks > 0 ? Math.max(0, Math.round((totalScore / totalMaxMarks) * 100)) : 0;

    attempt.submittedAt = new Date();
    attempt.status = 'submitted';
    attempt.totalScore = totalScore;
    attempt.percentage = percentage;
    attempt.timeTakenSeconds = Math.round((attempt.submittedAt.getTime() - attempt.startedAt.getTime()) / 1000);
    attempt.autoGraded = linkedQuestions.every(lq => lq.question.type !== 'descriptive');

    const savedAttempt = await this.taAttemptRepo.save(attempt);

    const legacyResult = this.resultRepo.create({
      tenantId,
      assessmentId: attempt.assessmentId,
      studentId: attempt.studentId,
      score: totalScore,
      percentage: percentage,
      gradedBy: 'auto-graded',
      remarks: 'Submitted through online testing environment.',
    });
    await this.resultRepo.save(legacyResult);

    return { data: savedAttempt };
  }

  async getAttemptResult(attemptId: string, tenantId: string) {
    const attempt = await this.taAttemptRepo.findOne({
      where: { id: attemptId, tenantId },
      relations: ['assessment']
    });
    if (!attempt) throw new NotFoundException(`Attempt ${attemptId} not found`);

    const answers = await this.taAnswerRepo.find({
      where: { attemptId, tenantId },
      relations: ['question', 'question.options']
    });

    return {
      data: {
        attempt,
        answers
      }
    };
  }

  private logTiming(action: string, tenantId: string, userId: string, ms: number) {
    console.log(`[OBSERVABILITY] [${new Date().toISOString()}] Module: TeacherAssessments | Action: ${action} | Tenant: ${tenantId} | User: ${userId} | Duration: ${ms}ms`);
  }
}
