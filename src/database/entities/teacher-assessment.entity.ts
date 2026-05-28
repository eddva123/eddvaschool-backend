import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Base } from './base.entity';
import { Tenant } from './tenant.entity';

@Entity('teacher_assessments')
@Index('IDX_teacher_assessments_tenant_teacher', ['tenantId', 'teacherId'])
export class TeacherAssessment extends Base {
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

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ default: 'quiz' })
  type: string; // 'quiz', 'unit_test', 'mock_test', 'subject_test'

  @Column({ name: 'total_marks', type: 'int', default: 100 })
  totalMarks: number;

  @Column({ name: 'duration_minutes', type: 'int', nullable: true })
  durationMinutes: number;

  @Column({ name: 'passing_marks', type: 'float', nullable: true })
  passingMarks: number;

  @Column({ name: 'shuffle_questions', default: false })
  shuffleQuestions: boolean;

  @Column({ name: 'show_answers_after_submit', default: true })
  showAnswersAfterSubmit: boolean;

  @Column({ name: 'allow_reattempt', default: false })
  allowReattempt: boolean;

  @Column({ nullable: true, default: 'draft' })
  status: string; // 'draft', 'published'
}

@Entity('teacher_assessment_sections')
export class TeacherAssessmentSection extends Base {
  @Column({
    name: 'tenant_id',
    type: 'uuid',
    nullable: true,
  })
  tenantId?: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'assessment_id' })
  assessmentId: string;

  @ManyToOne(() => TeacherAssessment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assessment_id' })
  assessment: TeacherAssessment;

  @Column()
  title: string;

  @Column({ default: 0 })
  order: number;
}

@Entity('teacher_assessment_results')
export class TeacherAssessmentResult extends Base {
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

  @Column({ name: 'assessment_id' })
  assessmentId: string;

  @ManyToOne(() => TeacherAssessment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assessment_id' })
  assessment: TeacherAssessment;

  @Column({ name: 'student_id' })
  studentId: string;

  @Column({ type: 'float', default: 0 })
  score: number;

  @Column({ type: 'float', default: 0 })
  percentage: number;

  @Column({ name: 'graded_by', nullable: true })
  gradedBy: string;

  @Column({ nullable: true })
  remarks: string;
}
