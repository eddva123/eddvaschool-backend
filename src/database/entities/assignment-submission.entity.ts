import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Base } from './base.entity';
import { Tenant } from './tenant.entity';
import { Assignment } from '../../assignments/entities/assignment.entity';

@Entity('assignment_submissions')
@Index('IDX_submissions_tenant_assignment', ['tenantId', 'assignmentId'])
export class AssignmentSubmission extends Base {
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

  @Column({ name: 'assignment_id' })
  assignmentId: string;

  @ManyToOne(() => Assignment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assignment_id' })
  assignment: Assignment;

  @Column({ name: 'student_id' })
  studentId: string;

  @Column({ nullable: true,  default: 'submitted' })
  status: string; // 'submitted', 'late', 'pending'

  @Column({ name: 'submitted_at', type: 'timestamptz', default: () => 'NOW()' })
  submittedAt: Date;

  @Column({ name: 'attachment_url', nullable: true })
  attachmentUrl: string;

  @Column({ name: 'student_notes', type: 'text', nullable: true })
  studentNotes: string;

  @Column({ name: 'is_late_submission', default: false })
  isLateSubmission: boolean;

  @Column({ name: 'attempt_number', type: 'int', default: 1 })
  attemptNumber: number;

  @Column({ name: 'teacher_remarks', type: 'text', nullable: true })
  teacherRemarks: string;

  @Column({ name: 'feedback_summary', type: 'text', nullable: true })
  feedbackSummary: string;

  @Column({ name: 'attachment_preview_metadata', type: 'jsonb', nullable: true })
  attachmentPreviewMetadata: Record<string, any>;
}

@Entity('assignment_grades')
export class AssignmentGrade extends Base {
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

  @Column({ name: 'submission_id' })
  submissionId: string;

  @ManyToOne(() => AssignmentSubmission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'submission_id' })
  submission: AssignmentSubmission;

  @Column({ nullable: true })
  grade: string;

  @Column({ type: 'float', default: 0 })
  score: number;

  @Column({ name: 'graded_by' })
  gradedBy: string;

  @Column({ nullable: true })
  remarks: string;

  @Column({ name: 'rubric_breakdown', type: 'jsonb', nullable: true })
  rubricBreakdown: Record<string, number>; // criterion -> score
}
