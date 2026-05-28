import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Assignment } from '../../../assignments/entities/assignment.entity';
import { AssignmentSubmission, AssignmentGrade } from '../../../database/entities/assignment-submission.entity';
import { AttendanceRecord, AttendanceSession } from '../../../database/entities/attendance.entity';
import { TeacherAssessment, TeacherAssessmentResult, TeacherAssessmentSection } from '../../../database/entities/teacher-assessment.entity';
import { TeacherAssessmentAttempt, TeacherAssessmentAnswer } from '../../../database/entities/teacher-assessment-expansion.entity';
import { EngagementLog, PerformanceProfile } from '../../../database/entities/analytics.entity';
import { Student } from '../../../database/entities/student.entity';
import { TeacherCacheService } from '../common/teacher-cache.service';

@Injectable()
export class TeacherAnalyticsService {
  constructor(
    @InjectRepository(Assignment)
    private readonly assignmentRepo: Repository<Assignment>,
    @InjectRepository(AssignmentSubmission)
    private readonly assignmentSubmissionRepo: Repository<AssignmentSubmission>,
    @InjectRepository(AssignmentGrade)
    private readonly assignmentGradeRepo: Repository<AssignmentGrade>,
    @InjectRepository(AttendanceRecord)
    private readonly attendanceRecordRepo: Repository<AttendanceRecord>,
    @InjectRepository(TeacherAssessmentResult)
    private readonly assessmentResultRepo: Repository<TeacherAssessmentResult>,
    @InjectRepository(TeacherAssessmentAnswer)
    private readonly assessmentAnswerRepo: Repository<TeacherAssessmentAnswer>,
    @InjectRepository(TeacherAssessmentSection)
    private readonly assessmentSectionRepo: Repository<TeacherAssessmentSection>,
    @InjectRepository(EngagementLog)
    private readonly engagementLogRepo: Repository<EngagementLog>,
    @InjectRepository(PerformanceProfile)
    private readonly performanceProfileRepo: Repository<PerformanceProfile>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    private readonly cacheService: TeacherCacheService,
  ) {}

  // ── Existing ─────────────────────────────────────────────────────────────

  async getAttendanceSummary(tenantId: string, user: any) {
    const startTime = Date.now();
    const records = await this.attendanceRecordRepo.find({ where: { tenantId } });

    const total = records.length;
    const present = records.filter(r => r.status === 'PRESENT').length;
    const absent = records.filter(r => r.status === 'ABSENT').length;
    const late = records.filter(r => r.status === 'LATE').length;
    const attendancePct = total > 0 ? Math.round((present / total) * 100) : 0;

    this.logTiming('getAttendanceSummary', tenantId, user?.id, Date.now() - startTime);
    return {
      data: {
        totalRecords: total,
        present,
        absent,
        late,
        attendancePercentage: attendancePct,
      },
    };
  }

  async getAssignmentCompletion(tenantId: string, user: any) {
    const startTime = Date.now();
    const assignments = await this.assignmentRepo.find({
      where: { tenantId, deletedAt: IsNull() },
    });

    const total = assignments.length;
    const active = assignments.filter(a => a.status === 'Active').length;
    const completionRate = total > 0 ? Math.round((active / total) * 100) : 0;

    this.logTiming('getAssignmentCompletion', tenantId, user?.id, Date.now() - startTime);
    return {
      data: {
        totalAssignments: total,
        activeAssignments: active,
        completionRate,
      },
    };
  }

  async getDashboardMetrics(tenantId: string, user: any) {
    const cacheKey = this.cacheService.formatKey(tenantId, 'analytics', user?.id || 'global');

    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const [attendanceSummary, assignmentCompletion] = await Promise.all([
      this.getAttendanceSummary(tenantId, user),
      this.getAssignmentCompletion(tenantId, user),
    ]);

    const result = {
      data: {
        attendance: attendanceSummary.data,
        assignments: assignmentCompletion.data,
        averageScore: 82,
        passRate: 95,
      },
    };

    await this.cacheService.set(cacheKey, result, 300 * 1000);
    return result;
  }

  // ── 1. Assessment Analytics ──────────────────────────────────────────────────
  async getAssessmentPerformanceSummary(tenantId: string, assessmentId?: string) {
    const cacheKey = this.cacheService.formatKey(tenantId, 'analytics', `assessment_summary:${assessmentId || 'all'}`);
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) return cached;

    const qb = this.assessmentResultRepo.createQueryBuilder('res')
      .where('res.tenant_id = :tenantId', { tenantId })
      .select('AVG(res.percentage)', 'averageScore')
      .addSelect('MAX(res.percentage)', 'highestScore')
      .addSelect('MIN(res.percentage)', 'lowestScore')
      .addSelect('COUNT(res.id)', 'totalAttempts');

    if (assessmentId) {
      qb.andWhere('res.assessment_id = :assessmentId', { assessmentId });
    }

    const res = await qb.getRawOne();
    
    // Calculate pass rate (assume > 40% is pass for analytics, or we could fetch passingMarks)
    let passRate = 0;
    if (res && res.totalAttempts > 0) {
      const passQb = this.assessmentResultRepo.createQueryBuilder('res')
        .where('res.tenant_id = :tenantId', { tenantId })
        .andWhere('res.percentage >= 40');
      
      if (assessmentId) {
        passQb.andWhere('res.assessment_id = :assessmentId', { assessmentId });
      }
      const passCount = await passQb.getCount();
      passRate = (passCount / res.totalAttempts) * 100;
    }

    const result = {
      averageScore: res?.averageScore ? parseFloat(res.averageScore) : 0,
      highestScore: res?.highestScore ? parseFloat(res.highestScore) : 0,
      lowestScore: res?.lowestScore ? parseFloat(res.lowestScore) : 0,
      totalAttempts: res?.totalAttempts ? parseInt(res.totalAttempts, 10) : 0,
      passRate,
    };

    await this.cacheService.set(cacheKey, result, 300 * 1000);
    return result;
  }

  async getAssessmentScoreDistribution(tenantId: string, assessmentId?: string) {
    const cacheKey = this.cacheService.formatKey(tenantId, 'analytics', `assessment_dist:${assessmentId || 'all'}`);
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) return cached;

    const qb = this.assessmentResultRepo.createQueryBuilder('res')
      .where('res.tenant_id = :tenantId', { tenantId })
      .select(`
        CASE 
          WHEN res.percentage >= 90 THEN '90-100'
          WHEN res.percentage >= 80 THEN '80-89'
          WHEN res.percentage >= 70 THEN '70-79'
          WHEN res.percentage >= 60 THEN '60-69'
          WHEN res.percentage >= 50 THEN '50-59'
          ELSE '<50'
        END
      `, 'range')
      .addSelect('COUNT(res.id)', 'count')
      .groupBy('range');

    if (assessmentId) {
      qb.andWhere('res.assessment_id = :assessmentId', { assessmentId });
    }

    const raw = await qb.getRawMany();
    const result = {
      '90-100': 0, '80-89': 0, '70-79': 0, '60-69': 0, '50-59': 0, '<50': 0
    };
    raw.forEach(r => {
      if (result[r.range] !== undefined) {
        result[r.range] = parseInt(r.count, 10);
      }
    });

    await this.cacheService.set(cacheKey, result, 300 * 1000);
    return result;
  }

  async getSectionWisePerformance(tenantId: string, assessmentId: string) {
    const cacheKey = this.cacheService.formatKey(tenantId, 'analytics', `section_perf:${assessmentId}`);
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) return cached;

    // This requires joining answers with assessment questions to get the section
    const qb = this.assessmentAnswerRepo.createQueryBuilder('ans')
      .innerJoin('ans.attempt', 'attempt')
      .innerJoin('teacher_assessment_questions', 'taq', 'taq.question_id = ans.question_id AND taq.assessment_id = attempt.assessment_id')
      .leftJoin('taq.section', 'section')
      .where('ans.tenant_id = :tenantId', { tenantId })
      .andWhere('attempt.assessment_id = :assessmentId', { assessmentId })
      .select('COALESCE(section.title, \'Unsectioned\')', 'sectionName')
      .addSelect('AVG(CAST(ans.is_correct AS INT)) * 100', 'averageAccuracy')
      .groupBy('section.id, section.title');

    const result = await qb.getRawMany();
    await this.cacheService.set(cacheKey, result, 300 * 1000);
    return result;
  }

  // ── 2. Question Difficulty Analysis ──────────────────────────────────────────
  async getQuestionDifficultyAnalytics(tenantId: string) {
    const cacheKey = this.cacheService.formatKey(tenantId, 'analytics', 'question_difficulty');
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) return cached;

    // deterministic formula ONLY: difficulty = correctAttempts / totalAttempts
    const qb = this.assessmentAnswerRepo.createQueryBuilder('ans')
      .where('ans.tenant_id = :tenantId', { tenantId })
      .andWhere('ans.is_correct IS NOT NULL') // only autograded
      .select('ans.question_id', 'questionId')
      .addSelect('COUNT(ans.id)', 'totalAttempts')
      .addSelect('SUM(CAST(ans.is_correct AS INT))', 'correctAttempts')
      .addSelect('AVG(ans.time_spent_seconds)', 'averageTimeSpent')
      .groupBy('ans.question_id');

    const raw = await qb.getRawMany();
    const result = raw.map(r => {
      const total = parseInt(r.totalAttempts, 10);
      const correct = parseInt(r.correctAttempts, 10);
      const successRate = total > 0 ? correct / total : 0;
      
      let difficulty = 'MEDIUM';
      if (successRate >= 0.75) difficulty = 'EASY';
      else if (successRate <= 0.35) difficulty = 'HARD';

      return {
        questionId: r.questionId,
        difficulty,
        successRate: successRate * 100,
        averageTimeSpent: parseFloat(r.averageTimeSpent) || 0,
      };
    });

    await this.cacheService.set(cacheKey, result, 600 * 1000); // 600s as requested
    return result;
  }

  // ── 3. Class Performance Trends ──────────────────────────────────────────────
  async getClassPerformanceTrends(tenantId: string, timeframe: 'weekly' | 'monthly') {
    const cacheKey = this.cacheService.formatKey(tenantId, 'analytics', `class_trends:${timeframe}`);
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) return cached;

    const format = timeframe === 'weekly' ? 'IYYY-IW' : 'YYYY-MM';
    
    const qb = this.assessmentResultRepo.createQueryBuilder('res')
      .innerJoin('res.student', 'student')
      .where('res.tenant_id = :tenantId', { tenantId })
      .select(`to_char(res.created_at, '${format}')`, 'period')
      .addSelect('student.class', 'className')
      .addSelect('AVG(res.percentage)', 'averageScore')
      .groupBy(`to_char(res.created_at, '${format}'), student.class`)
      .orderBy('period', 'ASC');

    const raw = await qb.getRawMany();
    await this.cacheService.set(cacheKey, raw, 300 * 1000);
    return raw;
  }

  // ── 4. Attendance vs Performance Correlation ─────────────────────────────────
  async getAttendancePerformanceCorrelation(tenantId: string) {
    const cacheKey = this.cacheService.formatKey(tenantId, 'analytics', 'attendance_perf_corr');
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) return cached;

    // Use PerformanceProfile (which has overall_accuracy) + Attendance
    const studentsQb = this.studentRepo.createQueryBuilder('s')
      .where('s.tenant_id = :tenantId', { tenantId })
      .leftJoin(PerformanceProfile, 'perf', 'perf.student_id = s.id')
      .select('s.id', 'studentId')
      .addSelect('perf.overall_accuracy', 'overallAccuracy');
      
    const students = await studentsQb.getRawMany();
    const studentIds = students.map(s => s.studentId);
    
    if (studentIds.length === 0) return [];

    const attQb = this.attendanceRecordRepo.createQueryBuilder('ar')
      .where('ar.tenant_id = :tenantId', { tenantId })
      .andWhere('ar.student_id IN (:...studentIds)', { studentIds })
      .select('ar.student_id', 'studentId')
      .addSelect('COUNT(ar.id)', 'totalSessions')
      .addSelect('SUM(CASE WHEN ar.status = \'PRESENT\' THEN 1 ELSE 0 END)', 'presentCount')
      .groupBy('ar.student_id');

    const attStats = await attQb.getRawMany();
    const attMap = new Map();
    attStats.forEach(a => {
      const total = parseInt(a.totalSessions, 10);
      const present = parseInt(a.presentCount, 10);
      attMap.set(a.studentId, total > 0 ? (present / total) * 100 : 0);
    });

    const result = students.map(s => ({
      studentId: s.studentId,
      attendancePercentage: attMap.get(s.studentId) || 0,
      averageScore: s.overallAccuracy ? parseFloat(s.overallAccuracy) : 0,
    }));

    // aggregate into buckets
    const buckets = {
      '>90% Attendance': { count: 0, scoreSum: 0 },
      '75-90% Attendance': { count: 0, scoreSum: 0 },
      '<75% Attendance': { count: 0, scoreSum: 0 },
    };

    result.forEach(r => {
      let bucket = '<75% Attendance';
      if (r.attendancePercentage >= 90) bucket = '>90% Attendance';
      else if (r.attendancePercentage >= 75) bucket = '75-90% Attendance';
      
      buckets[bucket].count++;
      buckets[bucket].scoreSum += r.averageScore;
    });

    const finalInsight = Object.keys(buckets).map(k => ({
      attendanceBucket: k,
      studentCount: buckets[k].count,
      averageScore: buckets[k].count > 0 ? buckets[k].scoreSum / buckets[k].count : 0,
    }));

    await this.cacheService.set(cacheKey, finalInsight, 300 * 1000);
    return finalInsight;
  }

  // ── 5. Assignment Completion Trends ──────────────────────────────────────────
  async getAssignmentCompletionTrends(tenantId: string) {
    const cacheKey = this.cacheService.formatKey(tenantId, 'analytics', 'assignment_trends');
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) return cached;

    const qb = this.assignmentSubmissionRepo.createQueryBuilder('sub')
      .innerJoin('sub.assignment', 'a')
      .where('sub.tenant_id = :tenantId', { tenantId })
      .select('to_char(a.due_date, \'YYYY-MM\')', 'month')
      .addSelect('COUNT(sub.id)', 'totalSubmissions')
      .addSelect('SUM(CASE WHEN sub.status = \'late\' THEN 1 ELSE 0 END)', 'lateSubmissions')
      .groupBy('to_char(a.due_date, \'YYYY-MM\')')
      .orderBy('month', 'ASC');

    const result = await qb.getRawMany();
    await this.cacheService.set(cacheKey, result, 300 * 1000);
    return result;
  }

  // ── 6. Advanced Assignment Engagement Analytics ──────────────────────────────
  async getAssignmentEngagementAnalytics(tenantId: string) {
    const cacheKey = this.cacheService.formatKey(tenantId, 'analytics', 'assignment_engagement');
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) return cached;

    // Overdue / Late submission trends
    const lateQb = this.assignmentSubmissionRepo.createQueryBuilder('sub')
      .where('sub.tenant_id = :tenantId', { tenantId })
      .select('SUM(CAST(sub.is_late_submission AS INT))', 'totalLate')
      .addSelect('COUNT(sub.id)', 'totalSubmissions');

    const lateStats = await lateQb.getRawOne();

    // Grading turnaround metrics
    const gradeQb = this.assignmentGradeRepo.createQueryBuilder('g')
      .innerJoin('g.submission', 'sub')
      .where('g.tenant_id = :tenantId', { tenantId })
      .select('AVG(EXTRACT(EPOCH FROM (g.created_at - sub.submitted_at)))', 'avgTurnaroundSeconds');

    const gradeStats = await gradeQb.getRawOne();

    // Participation / Completion heatmap (by day of week)
    const heatmapQb = this.assignmentSubmissionRepo.createQueryBuilder('sub')
      .where('sub.tenant_id = :tenantId', { tenantId })
      .select('EXTRACT(ISODOW FROM sub.submitted_at)', 'dayOfWeek')
      .addSelect('COUNT(sub.id)', 'count')
      .groupBy('EXTRACT(ISODOW FROM sub.submitted_at)');

    const heatmap = await heatmapQb.getRawMany();
    const heatmapData = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
    heatmap.forEach(h => {
      heatmapData[h.dayOfWeek] = parseInt(h.count, 10);
    });

    const metrics = {
      lateSubmissionRate: lateStats?.totalSubmissions > 0 ? (lateStats.totalLate / lateStats.totalSubmissions) * 100 : 0,
      totalLateSubmissions: parseInt(lateStats?.totalLate || '0', 10),
      gradingTurnaroundHours: gradeStats?.avgTurnaroundSeconds ? parseFloat(gradeStats.avgTurnaroundSeconds) / 3600 : 0,
      completionHeatmap: heatmapData,
    };

    await this.cacheService.set(cacheKey, metrics, 300 * 1000);
    return metrics;
  }

  // ── 7. Engagement Metrics ──────────────────────────────────────────────────
  async getEngagementMetrics(tenantId: string) {
    const cacheKey = this.cacheService.formatKey(tenantId, 'analytics', 'engagement');
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) return cached;

    const qb = this.engagementLogRepo.createQueryBuilder('log')
      .innerJoin('log.student', 'student')
      .where('student.tenant_id = :tenantId', { tenantId })
      .select('log.state', 'state')
      .addSelect('COUNT(log.id)', 'count')
      .groupBy('log.state');

    const result = await qb.getRawMany();
    
    let totalLogs = 0;
    let engagedCount = 0;
    result.forEach(r => {
      const count = parseInt(r.count, 10);
      totalLogs += count;
      if (r.state === 'engaged' || r.state === 'thriving') engagedCount += count;
    });

    const engagementScore = totalLogs > 0 ? (engagedCount / totalLogs) * 100 : 0;

    const metrics = {
      engagementScore,
      stateBreakdown: result,
      totalSignals: totalLogs
    };

    await this.cacheService.set(cacheKey, metrics, 300 * 1000);
    return metrics;
  }

  private logTiming(action: string, tenantId: string, userId: string, ms: number) {
    console.log(`[OBSERVABILITY] [${new Date().toISOString()}] Module: TeacherAnalytics | Action: ${action} | Tenant: ${tenantId} | User: ${userId} | Duration: ${ms}ms`);
  }
}
