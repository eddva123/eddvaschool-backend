import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Base } from './base.entity';
import { Tenant } from './tenant.entity';
import { TeacherAssessment, TeacherAssessmentSection } from './teacher-assessment.entity';
import { Question } from './question.entity';

@Entity('teacher_assessment_questions')
@Index('IDX_ta_questions_tenant_assessment', ['tenantId', 'assessmentId'])
export class TeacherAssessmentQuestion extends Base {
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

  @Column({ name: 'question_id' })
  questionId: string;

  @ManyToOne(() => Question, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Column({ name: 'section_id', nullable: true })
  sectionId: string | null;

  @ManyToOne(() => TeacherAssessmentSection, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'section_id' })
  section: TeacherAssessmentSection | null;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ name: 'marks_correct', type: 'float', nullable: true })
  marksCorrect: number;

  @Column({ name: 'marks_wrong', type: 'float', nullable: true })
  marksWrong: number;
}

@Entity('teacher_assessment_attempts')
@Index('IDX_ta_attempts_tenant_assessment', ['tenantId', 'assessmentId'])
export class TeacherAssessmentAttempt extends Base {
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

  @Column({ name: 'started_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  startedAt: Date;

  @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
  submittedAt: Date | null;

  @Column({ type: 'varchar', length: 20, default: 'in_progress' })
  status: 'in_progress' | 'submitted' | 'auto_submitted';

  @Column({ name: 'total_score', type: 'float', default: 0 })
  totalScore: number;

  @Column({ type: 'float', default: 0 })
  percentage: number;

  @Column({ name: 'time_taken_seconds', type: 'int', default: 0 })
  timeTakenSeconds: number;

  @Column({ name: 'auto_graded', type: 'boolean', default: false })
  autoGraded: boolean;
}

@Entity('teacher_assessment_answers')
@Index('IDX_ta_answers_tenant_attempt', ['tenantId', 'attemptId'])
export class TeacherAssessmentAnswer extends Base {
  @Column({
    name: 'tenant_id',
    type: 'uuid',
    nullable: true,
  })
  tenantId?: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'attempt_id' })
  attemptId: string;

  @ManyToOne(() => TeacherAssessmentAttempt, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attempt_id' })
  attempt: TeacherAssessmentAttempt;

  @Column({ name: 'question_id' })
  questionId: string;

  @ManyToOne(() => Question, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Column({ name: 'selected_option_ids', type: 'jsonb', default: [] })
  selectedOptionIds: string[];

  @Column({ name: 'integer_answer', type: 'text', nullable: true })
  integerAnswer: string | null;

  @Column({ name: 'descriptive_answer', type: 'text', nullable: true })
  descriptiveAnswer: string | null;

  @Column({ name: 'is_correct', type: 'boolean', nullable: true })
  isCorrect: boolean | null;

  @Column({ name: 'marks_awarded', type: 'float', default: 0 })
  marksAwarded: number;

  @Column({ name: 'time_spent_seconds', type: 'int', default: 0 })
  timeSpentSeconds: number;
}
