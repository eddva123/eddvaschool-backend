import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Base, BaseWithDelete } from './base.entity';
import { Tenant } from './tenant.entity';
import { Student } from './student.entity';
import { Topic } from './subject.entity';
import { User } from './user.entity';

// ─── Performance Profile ──────────────────────────────────────────────────────
@Entity('performance_profiles')
export class PerformanceProfile extends BaseWithDelete {
  @Column({ name: 'student_id', unique: true })
  studentId: string;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ name: 'predicted_rank', nullable: true })
  predictedRank: number;

  @Column({ name: 'rank_confidence', type: 'float', nullable: true })
  rankConfidence: number;

  @Column({ name: 'overall_accuracy', type: 'float', default: 0 })
  overallAccuracy: number;

  @Column({ name: 'avg_speed_seconds', type: 'float', nullable: true })
  avgSpeedSeconds: number;

  @Column({ name: 'chapter_accuracy', type: 'jsonb', default: {} })
  chapterAccuracy: Record<string, number>;

  @Column({ name: 'subject_accuracy', type: 'jsonb', default: {} })
  subjectAccuracy: Record<string, number>;

  @Column({ name: 'last_updated_at', type: 'timestamptz', default: () => 'NOW()' })
  lastUpdatedAt: Date;
}

// ─── Weak Topic ───────────────────────────────────────────────────────────────
export enum WeakTopicSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('weak_topics')
export class WeakTopic extends BaseWithDelete {
  @Column({ name: 'student_id' })
  studentId: string;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ name: 'topic_id' })
  topicId: string;

  @ManyToOne(() => Topic)
  @JoinColumn({ name: 'topic_id' })
  topic: Topic;

  @Column({ type: 'enum', enum: WeakTopicSeverity, default: WeakTopicSeverity.MEDIUM })
  severity: WeakTopicSeverity;

  @Column({ name: 'accuracy', type: 'float', default: 0 })
  accuracy: number;

  @Column({ name: 'wrong_count', default: 0 })
  wrongCount: number;

  @Column({ name: 'doubt_count', default: 0 })
  doubtCount: number;

  @Column({ name: 'rewind_count', default: 0 })
  rewindCount: number;

  @Column({ name: 'last_attempted_at', type: 'timestamptz', nullable: true })
  lastAttemptedAt: Date;
}

// ─── Engagement Log (AI #5) ───────────────────────────────────────────────────
export enum EngagementState {
  ENGAGED = 'engaged',
  BORED = 'bored',
  CONFUSED = 'confused',
  FRUSTRATED = 'frustrated',
  THRIVING = 'thriving',
}

export enum EngagementContext {
  LECTURE = 'lecture',
  PRACTICE = 'practice',
  BATTLE = 'battle',
  MOCK_TEST = 'mock_test',
}

@Entity('engagement_logs')
export class EngagementLog extends BaseWithDelete {
  @Column({ name: 'student_id' })
  studentId: string;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ type: 'enum', enum: EngagementState })
  state: EngagementState;

  @Column({ type: 'enum', enum: EngagementContext })
  context: EngagementContext;

  @Column({ name: 'context_ref_id', nullable: true })
  contextRefId: string; // lecture_id, session_id, battle_id

  @Column({ name: 'confidence', type: 'float', nullable: true })
  confidence: number;

  @Column({ name: 'signals', type: 'jsonb', nullable: true })
  signals: Record<string, any>; // raw signals from AI

  @Column({ name: 'action_taken', nullable: true })
  actionTaken: string; // what the platform did in response

  @Column({ name: 'logged_at', type: 'timestamptz', default: () => 'NOW()' })
  loggedAt: Date;
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────
export enum LeaderboardScope {
  GLOBAL = 'global',
  STATE = 'state',
  CITY = 'city',
  SCHOOL = 'school',
  FRIEND = 'friend',
  SUBJECT = 'subject',
  BATTLE_XP = 'battle_xp',
}

export enum LeaderboardPeriod {
  ALL_TIME = 'all_time',
  MONTHLY = 'monthly',
  WEEKLY = 'weekly',
}

@Entity('leaderboard_entries')
export class LeaderboardEntry extends BaseWithDelete {
  @Column({ name: 'student_id' })
  studentId: string;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ type: 'enum', enum: LeaderboardScope })
  scope: LeaderboardScope;

  @Column({ name: 'scope_value', nullable: true })
  scopeValue: string; // e.g. "Mumbai" for city scope, subject_id for subject scope

  @Column({ type: 'enum', enum: LeaderboardPeriod, default: LeaderboardPeriod.ALL_TIME })
  period: LeaderboardPeriod;

  @Column({ name: 'score', type: 'float', default: 0 })
  score: number;

  @Column({ name: 'rank', default: 0 })
  rank: number;

  @Column({ name: 'percentile', type: 'float', nullable: true })
  percentile: number;

  @Column({ name: 'computed_at', type: 'timestamptz', default: () => 'NOW()' })
  computedAt: Date;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export enum NotificationType {
  INFO = 'info',
  WARNING = 'warning',
  SUCCESS = 'success',
  ERROR = 'error',
}

@Entity('notifications')
export class Notification extends BaseWithDelete {
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.INFO,
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt: Date;
}