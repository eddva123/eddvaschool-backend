import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AttendanceSession, AttendanceRecord } from '../../../database/entities/attendance.entity';
import { Student } from '../../../database/entities/student.entity';
import { TeacherDataStoreService, AttendanceItem } from '../../compat/teacher-datastore.service';
import { TeacherCacheService } from '../common/teacher-cache.service';

@Injectable()
export class TeacherAttendanceService {
  constructor(
    @InjectRepository(AttendanceSession)
    private readonly sessionRepo: Repository<AttendanceSession>,
    @InjectRepository(AttendanceRecord)
    private readonly recordRepo: Repository<AttendanceRecord>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    private readonly dataStoreService: TeacherDataStoreService,
    private readonly cacheService: TeacherCacheService,
  ) {}

  async getAttendanceReport(user: any) {
    const tenantId = user?.tenantId;
    const startTime = Date.now();

    // 1. Fetch normalized records
    const sessions = await this.sessionRepo.find({
      where: { tenantId },
      order: { date: 'DESC' },
    });

    const sessionIds = sessions.map(s => s.id);
    let records: AttendanceRecord[] = [];
    if (sessionIds.length > 0) {
      records = await this.recordRepo.find({
        where: { sessionId: In(sessionIds) },
      });
    }

    // 2. Fallback to JSONB if database contains no normalized rows (automatic migration check)
    if (sessions.length === 0) {
      const store = await this.dataStoreService.getData<AttendanceItem>(tenantId, 'attendance', []);
      const activeRecords = store.items.filter(item => !item.isDeleted);
      
      // Auto-migrate on-the-fly to normalized tables in the background!
      if (activeRecords.length > 0) {
        this.logTiming('getAttendanceReport:migrating', tenantId, user?.id, Date.now() - startTime);
        await this.migrateJsonbToNormalized(tenantId, activeRecords, user?.id || 'system');
        return this.getAttendanceReport(user); // Re-fetch normalized
      }
      return [];
    }

    // 3. Map students and sessions to match exactly what frontend expects
    const students = await this.studentRepo.find({
      where: { tenantId },
      relations: ['user'],
    });
    const studentLookup = new Map(students.map(s => [s.id, s]));

    const result = records.map(record => {
      const session = sessions.find(s => s.id === record.sessionId);
      const student = studentLookup.get(record.studentId);
      const className = session?.classId || 'Class';
      return {
        id: record.id,
        date: session?.date || new Date().toISOString().split('T')[0],
        status: record.status,
        remarks: record.remarks || '',
        user: {
          id: record.studentId,
          name: student?.user?.fullName || 'Student',
          role: 'STUDENT',
          studentProfile: {
            section: {
              class: { id: className, name: className },
              name: 'A',
            },
          },
        },
      };
    });

    this.logTiming('getAttendanceReport', tenantId, user?.id, Date.now() - startTime);
    return result;
  }

  async getAttendanceStudents(classId: string, user: any) {
    const tenantId = user?.tenantId;
    const students = await this.studentRepo.find({
      where: { tenantId },
      relations: ['user'],
    });

    return students.map(student => ({
      id: student.id,
      name: student.user?.fullName || 'Student',
      email: student.user?.email,
      studentProfile: {
        section: {
          class: { id: classId || 'Class', name: classId || 'Class' },
          name: 'A',
        },
      },
    }));
  }

  async markAttendance(payload: Record<string, any>, user: any) {
    const tenantId = user?.tenantId;
    const startTime = Date.now();
    const date = payload.date || new Date().toISOString().split('T')[0];
    const studentId = payload.studentId || payload.userId;

    if (!studentId) {
      throw new Error('Student ID is required');
    }

    // 1. Find or create session
    let session = await this.sessionRepo.findOne({
      where: { tenantId, date, classId: payload.className || payload.class || 'Class' },
    });

    if (!session) {
      session = this.sessionRepo.create({
        tenantId,
        teacherId: user?.id || 'system',
        classId: payload.className || payload.class || 'Class',
        date,
        markedBy: user?.id || 'system',
      });
      session = await this.sessionRepo.save(session);
    }

    // 2. Find or create attendance record for the student in this session
    let record = await this.recordRepo.findOne({
      where: { tenantId, sessionId: session.id, studentId },
    });

    if (record) {
      record.status = payload.status || 'PRESENT';
      record.remarks = payload.remarks || '';
    } else {
      record = this.recordRepo.create({
        tenantId,
        sessionId: session.id,
        studentId,
        status: payload.status || 'PRESENT',
        remarks: payload.remarks || '',
      });
    }
    await this.recordRepo.save(record);

    // 3. Write summary snapshot back to JSONB store for hybrid cache & backward compatibility
    const allSessions = await this.sessionRepo.find({ where: { tenantId } });
    const allRecords = await this.recordRepo.find({ where: { tenantId } });
    const students = await this.studentRepo.find({ where: { tenantId }, relations: ['user'] });
    const studentMap = new Map(students.map(s => [s.id, s]));

    const jsonbData: AttendanceItem[] = allRecords.map(r => {
      const s = allSessions.find(sess => sess.id === r.sessionId);
      const student = studentMap.get(r.studentId);
      return {
        id: r.id,
        studentId: r.studentId,
        name: student?.user?.fullName || 'Student',
        className: s?.classId || 'Class',
        present: r.status === 'PRESENT' ? 1 : 0,
        absent: r.status === 'ABSENT' ? 1 : 0,
        late: r.status === 'LATE' ? 1 : 0,
        percentage: r.status === 'PRESENT' ? 100 : 0,
        date: s?.date || date,
        status: r.status,
        remarks: r.remarks || '',
      };
    });

    await this.dataStoreService.saveData(tenantId, 'attendance', jsonbData, user?.id);

    // Invalidate dashboard cache
    if (user?.id) {
      const cacheKey = this.cacheService.formatKey(tenantId, 'dashboard', user.id);
      await this.cacheService.invalidate(cacheKey);
    }

    this.logTiming('markAttendance', tenantId, user?.id, Date.now() - startTime);

    return {
      success: true,
      message: 'Attendance marked successfully',
      marked: {
        studentId,
        name: payload.name || payload.studentName || 'Student',
        className: session.classId,
        status: record.status,
        date: session.date,
        remarks: record.remarks,
      },
    };
  }

  private async migrateJsonbToNormalized(tenantId: string, legacyRecords: AttendanceItem[], userId: string) {
    for (const legacy of legacyRecords) {
      let session = await this.sessionRepo.findOne({
        where: { tenantId, date: legacy.date, classId: legacy.className },
      });
      if (!session) {
        session = this.sessionRepo.create({
          tenantId,
          teacherId: userId,
          classId: legacy.className,
          date: legacy.date,
          markedBy: userId,
        });
        session = await this.sessionRepo.save(session);
      }

      const existingRecord = await this.recordRepo.findOne({
        where: { tenantId, sessionId: session.id, studentId: legacy.studentId },
      });

      if (!existingRecord) {
        const record = this.recordRepo.create({
          tenantId,
          sessionId: session.id,
          studentId: legacy.studentId,
          status: legacy.status || 'PRESENT',
          remarks: legacy.remarks || '',
        });
        await this.recordRepo.save(record);
      }
    }
  }

  private logTiming(action: string, tenantId: string, userId: string, ms: number) {
    console.log(`[OBSERVABILITY] [${new Date().toISOString()}] Module: TeacherAttendance | Action: ${action} | Tenant: ${tenantId} | User: ${userId} | Duration: ${ms}ms`);
  }
}
