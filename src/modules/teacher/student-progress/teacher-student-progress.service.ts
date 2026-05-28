import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PerformanceProfile, WeakTopic } from '../../../database/entities/analytics.entity';
import { AttendanceRecord, AttendanceSession } from '../../../database/entities/attendance.entity';
import { AssignmentSubmission } from '../../../database/entities/assignment-submission.entity';
import { Student } from '../../../database/entities/student.entity';
import { TeacherCacheService } from '../common/teacher-cache.service';
import { StudentProgressQueryDto, StudentRankingQueryDto, ProgressTimeframe } from './dto/student-progress.dto';

@Injectable()
export class TeacherStudentProgressService {
  private readonly logger = new Logger(TeacherStudentProgressService.name);

  constructor(
    @InjectRepository(PerformanceProfile)
    private readonly performanceProfileRepo: Repository<PerformanceProfile>,
    @InjectRepository(WeakTopic)
    private readonly weakTopicRepo: Repository<WeakTopic>,
    @InjectRepository(AttendanceRecord)
    private readonly attendanceRecordRepo: Repository<AttendanceRecord>,
    @InjectRepository(AttendanceSession)
    private readonly attendanceSessionRepo: Repository<AttendanceSession>,
    @InjectRepository(AssignmentSubmission)
    private readonly assignmentSubmissionRepo: Repository<AssignmentSubmission>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    private readonly cacheService: TeacherCacheService,
  ) {}

  /**
   * getClassProgressSummary
   */
  async getClassProgressSummary(tenantId: string, query: StudentProgressQueryDto) {
    const cacheKey = this.cacheService.formatKey(tenantId, 'student_progress', `summary:${query.classId || 'all'}:${query.batchId || 'all'}:${query.timeframe}`);
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    // We will aggregate avg attendance, avg assignment completion, avg overall accuracy
    let studentQb = this.studentRepo.createQueryBuilder('student')
      .where('student.tenant_id = :tenantId', { tenantId });
    
    if (query.classId) {
      studentQb.andWhere('student.class = :classId', { classId: query.classId });
    }

    const students = await studentQb.select(['student.id']).getMany();
    const studentIds = students.map(s => s.id);

    if (studentIds.length === 0) {
      return {
        totalStudents: 0,
        averageAccuracy: 0,
        averageAttendancePercentage: 0,
        averageAssignmentCompletion: 0,
      };
    }

    // 1. Avg Accuracy
    const perfQb = this.performanceProfileRepo.createQueryBuilder('perf')
      .where('perf.student_id IN (:...studentIds)', { studentIds })
      .select('AVG(perf.overall_accuracy)', 'avgAccuracy');
    const perfResult = await perfQb.getRawOne();
    const averageAccuracy = perfResult?.avgAccuracy ? parseFloat(perfResult.avgAccuracy) : 0;

    // 2. Avg Attendance
    const attendanceQb = this.attendanceRecordRepo.createQueryBuilder('ar')
      .where('ar.tenant_id = :tenantId', { tenantId })
      .andWhere('ar.student_id IN (:...studentIds)', { studentIds })
      .select('ar.status', 'status')
      .addSelect('COUNT(ar.id)', 'count')
      .groupBy('ar.status');
    const attResults = await attendanceQb.getRawMany();
    
    let presentCount = 0;
    let totalAttCount = 0;
    attResults.forEach(r => {
      const c = parseInt(r.count, 10);
      totalAttCount += c;
      if (r.status === 'PRESENT') {
        presentCount += c;
      }
    });
    const averageAttendancePercentage = totalAttCount > 0 ? (presentCount / totalAttCount) * 100 : 0;

    // 3. Avg Assignment Completion
    const submissionQb = this.assignmentSubmissionRepo.createQueryBuilder('sub')
      .where('sub.tenant_id = :tenantId', { tenantId })
      .andWhere('sub.student_id IN (:...studentIds)', { studentIds })
      .select('COUNT(sub.id)', 'totalSubmissions');
    const submissionResult = await submissionQb.getRawOne();
    const totalSubmissions = parseInt(submissionResult?.totalSubmissions || '0', 10);
    // Rough estimate, as we don't know total *assigned* here easily. We'll return count per student.
    const averageAssignmentCompletionCount = studentIds.length > 0 ? totalSubmissions / studentIds.length : 0;

    const result = {
      totalStudents: studentIds.length,
      averageAccuracy,
      averageAttendancePercentage,
      averageAssignmentCompletionCount,
    };

    await this.cacheService.set(cacheKey, result, 300 * 1000); // 300s TTL
    return result;
  }

  /**
   * getStudentProgressDetail
   */
  async getStudentProgressDetail(tenantId: string, studentId: string) {
    const student = await this.studentRepo.findOne({
      where: { id: studentId, tenantId },
    });
    if (!student) {
      throw new Error('Student not found in tenant');
    }

    const performance = await this.performanceProfileRepo.findOne({
      where: { studentId },
    });

    const weakTopics = await this.weakTopicRepo.find({
      where: { studentId },
      relations: ['topic'],
      order: { wrongCount: 'DESC' },
      take: 5,
    });

    const attendanceRecords = await this.attendanceRecordRepo.find({
      where: { studentId, tenantId },
      relations: ['session'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const assignmentSubmissions = await this.assignmentSubmissionRepo.find({
      where: { studentId, tenantId },
      relations: ['assignment'],
      order: { submittedAt: 'DESC' },
      take: 10,
    });

    return {
      student,
      performance: performance || null,
      weakTopics: weakTopics.map(wt => ({
        id: wt.id,
        topicName: wt.topic?.name,
        severity: wt.severity,
        wrongCount: wt.wrongCount,
      })),
      recentAttendance: attendanceRecords.map(ar => ({
        date: ar.session?.date,
        status: ar.status,
      })),
      recentAssignments: assignmentSubmissions.map(as => ({
        title: as.assignment?.title,
        status: as.status,
        submittedAt: as.submittedAt,
      })),
    };
  }

  /**
   * getAttendanceTrend
   */
  async getAttendanceTrend(tenantId: string, query: StudentProgressQueryDto) {
    const cacheKey = this.cacheService.formatKey(tenantId, 'student_progress', `att_trend:${query.classId || 'all'}:${query.batchId || 'all'}`);
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const qb = this.attendanceSessionRepo.createQueryBuilder('sess')
      .leftJoinAndSelect(AttendanceRecord, 'ar', 'ar.session_id = sess.id')
      .where('sess.tenant_id = :tenantId', { tenantId })
      .select('sess.date', 'date')
      .addSelect('ar.status', 'status')
      .addSelect('COUNT(ar.id)', 'count')
      .groupBy('sess.date, ar.status')
      .orderBy('sess.date', 'ASC');

    if (query.classId) {
      qb.andWhere('sess.class_id = :classId', { classId: query.classId });
    }
    if (query.batchId) {
      qb.andWhere('sess.batch_id = :batchId', { batchId: query.batchId });
    }

    const results = await qb.getRawMany();
    
    // transform into date-based map
    const trendMap = {};
    for (const r of results) {
      if (!trendMap[r.date]) {
        trendMap[r.date] = { present: 0, absent: 0, late: 0, total: 0 };
      }
      const c = parseInt(r.count, 10);
      trendMap[r.date].total += c;
      if (r.status === 'PRESENT') trendMap[r.date].present += c;
      if (r.status === 'ABSENT') trendMap[r.date].absent += c;
      if (r.status === 'LATE') trendMap[r.date].late += c;
    }

    const trendArray = Object.keys(trendMap).map(date => ({
      date,
      attendancePercentage: trendMap[date].total > 0 ? (trendMap[date].present / trendMap[date].total) * 100 : 0,
      stats: trendMap[date]
    }));

    await this.cacheService.set(cacheKey, trendArray, 300 * 1000);
    return trendArray;
  }

  /**
   * getAssignmentCompletionByClass
   */
  async getAssignmentCompletionByClass(tenantId: string, query: StudentProgressQueryDto) {
    // Basic aggregation
    const cacheKey = this.cacheService.formatKey(tenantId, 'student_progress', `assignment_comp:${query.classId || 'all'}:${query.batchId || 'all'}`);
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const qb = this.assignmentSubmissionRepo.createQueryBuilder('sub')
      .leftJoin('sub.assignment', 'assign')
      .where('sub.tenant_id = :tenantId', { tenantId })
      .select('assign.id', 'assignmentId')
      .addSelect('assign.title', 'title')
      .addSelect('sub.status', 'status')
      .addSelect('COUNT(sub.id)', 'count')
      .groupBy('assign.id, assign.title, sub.status');
    
    if (query.classId) {
      qb.andWhere('assign.class_id = :classId', { classId: query.classId });
    }

    const results = await qb.getRawMany();
    const mapped = {};
    for (const r of results) {
      if (!mapped[r.assignmentId]) {
        mapped[r.assignmentId] = { title: r.title, submitted: 0, late: 0, pending: 0 };
      }
      const c = parseInt(r.count, 10);
      if (r.status === 'submitted') mapped[r.assignmentId].submitted += c;
      if (r.status === 'late') mapped[r.assignmentId].late += c;
      if (r.status === 'pending') mapped[r.assignmentId].pending += c;
    }

    const finalArray = Object.values(mapped);
    await this.cacheService.set(cacheKey, finalArray, 300 * 1000);
    return finalArray;
  }

  /**
   * getWeakAreasForClass
   */
  async getWeakAreasForClass(tenantId: string, query: StudentProgressQueryDto) {
    const cacheKey = this.cacheService.formatKey(tenantId, 'student_progress', `weak_areas:${query.classId || 'all'}`);
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    let studentQb = this.studentRepo.createQueryBuilder('student')
      .where('student.tenant_id = :tenantId', { tenantId });
    
    if (query.classId) {
      studentQb.andWhere('student.class = :classId', { classId: query.classId });
    }
    const students = await studentQb.select(['student.id']).getMany();
    const studentIds = students.map(s => s.id);

    if (studentIds.length === 0) return [];

    const qb = this.weakTopicRepo.createQueryBuilder('wt')
      .leftJoinAndSelect('wt.topic', 'topic')
      .where('wt.student_id IN (:...studentIds)', { studentIds })
      .select('topic.id', 'topicId')
      .addSelect('topic.name', 'topicName')
      .addSelect('COUNT(wt.id)', 'studentCount')
      .addSelect('AVG(wt.wrong_count)', 'avgWrongCount')
      .groupBy('topic.id, topic.name')
      .orderBy('COUNT(wt.id)', 'DESC')
      .take(10);

    const results = await qb.getRawMany();
    await this.cacheService.set(cacheKey, results, 300 * 1000);
    return results;
  }

  /**
   * getStudentRankingInClass
   * Deterministic metrics only: overall_accuracy from performance_profiles
   */
  async getStudentRankingInClass(tenantId: string, query: StudentRankingQueryDto) {
    const cacheKey = this.cacheService.formatKey(tenantId, 'student_progress', `ranking:${query.classId || 'all'}:${query.subjectId || 'overall'}`);
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    let studentQb = this.studentRepo.createQueryBuilder('student')
      .where('student.tenant_id = :tenantId', { tenantId });
    
    if (query.classId) {
      studentQb.andWhere('student.class = :classId', { classId: query.classId });
    }
    const students = await studentQb.select(['student.id']).getMany();
    const studentIds = students.map(s => s.id);

    if (studentIds.length === 0) return [];

    const qb = this.performanceProfileRepo.createQueryBuilder('perf')
      .leftJoinAndSelect('perf.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .where('perf.student_id IN (:...studentIds)', { studentIds })
      .orderBy('perf.overall_accuracy', 'DESC')
      .take(50); // top 50

    const results = await qb.getMany();
    const rankings = results.map((r, index) => ({
      rank: index + 1,
      studentId: r.studentId,
      studentName: r.student?.user?.fullName || 'Unknown',
      overallAccuracy: r.overallAccuracy,
      predictedRank: r.predictedRank, // we return what's in DB, no recalculation of AI stuff
    }));

    await this.cacheService.set(cacheKey, rankings, 300 * 1000);
    return rankings;
  }
}
