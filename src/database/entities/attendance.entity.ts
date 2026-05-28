import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Base } from './base.entity';
import { Tenant } from './tenant.entity';

@Entity('attendance_sessions')
@Index('IDX_attendance_sessions_tenant_date', ['tenantId', 'date'])
export class AttendanceSession extends Base {
  @Index()
  @Column({
    name: 'tenant_id',
    type: 'uuid',
    nullable: true,
  })
  tenantId?: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'teacher_id' })
  teacherId: string;

  @Column({ name: 'class_id', nullable: true })
  classId: string;

  @Column({ name: 'batch_id', nullable: true })
  batchId: string;

  @Column({ name: 'subject_id', nullable: true })
  subjectId: string;

  @Column()
  date: string; // YYYY-MM-DD

  @Column({ name: 'marked_by' })
  markedBy: string;
}

@Entity('attendance_records')
@Index('IDX_attendance_records_tenant_student', ['tenantId', 'studentId'])
export class AttendanceRecord extends Base {
  @Index()
  @Column({
    name: 'tenant_id',
    type: 'uuid',
    nullable: true,
  })
  tenantId?: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'session_id' })
  sessionId: string;

  @ManyToOne(() => AttendanceSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: AttendanceSession;

  @Column({ name: 'student_id' })
  studentId: string;

  @Column({ nullable: true })
  status: string; // 'PRESENT', 'ABSENT', 'LATE'

  @Column({ nullable: true })
  remarks: string;
}
