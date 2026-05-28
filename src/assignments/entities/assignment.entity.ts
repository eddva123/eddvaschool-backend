import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Base } from '../../database/entities/base.entity';
import { Tenant } from '../../database/entities/tenant.entity';

@Entity('assignments')
@Index('IDX_assignments_tenant_teacher', ['tenantId', 'teacherId'])
export class Assignment extends Base {
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

  @Column({ name: 'teacher_id', nullable: true })
  teacherId: string;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ name: 'class_id', nullable: true })
  classId: string;

  @Column({ name: 'class_name', nullable: true })
  className: string;

  @Column({ name: 'subject_id', nullable: true })
  subjectId: string;

  @Column({ name: 'subject_name', nullable: true })
  subjectName: string;

  @Column({ name: 'due_date', type: 'varchar', nullable: true })
  dueDate: string;

  @Column({ nullable: true,  name: 'max_marks', type: 'int', default: 100 })
  maxMarks: number;

  @Column({ nullable: true,  default: 'Active' })
  status: string; // 'Active', 'DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'

  @Column({ type: 'varchar', default: 'homework' })
  type: string;

  @Column('text', { nullable: true })
  instructions: string;

  @Column({ name: 'publish_at', type: 'timestamp', nullable: true })
  publishAt: Date | null;

  @Column({ name: 'allow_resubmission', default: false })
  allowResubmission: boolean;

  @Column({ name: 'max_attempts', type: 'int', default: 1 })
  maxAttempts: number;

  @Column({ name: 'rubric_enabled', default: false })
  rubricEnabled: boolean;

  @Column({ name: 'total_marks', type: 'float', nullable: true })
  totalMarks: number | null;

  @Column({ name: 'late_submission_allowed', default: false })
  lateSubmissionAllowed: boolean;

  @Column({ name: 'late_penalty_percentage', type: 'float', default: 0 })
  latePenaltyPercentage: number;
}
