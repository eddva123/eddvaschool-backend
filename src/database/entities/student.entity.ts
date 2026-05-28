import { Entity, Column, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { Base } from './base.entity';
import { User } from './user.entity';
import { Tenant } from './tenant.entity';

export enum ExamTarget {
  JEE = 'jee',
  NEET = 'neet',
  BOTH = 'both',
  JEE_MAINS = 'jee_mains',
  JEE_ADVANCED = 'jee_advanced',
  FOUNDATION = 'foundation',
  OTHER = 'other',
}

export enum StudentClass {
  CLASS_8 = '8',
  CLASS_9 = '9',
  CLASS_10 = '10',
  CLASS_11 = '11',
  CLASS_12 = '12',
  DROPPER = 'dropper',
}

export enum ExamYear {
  Y2025 = '2025',
  Y2026 = '2026',
  Y2027 = '2027',
  Y2028 = '2028',
  Y2029 = '2029',
  Y2030 = '2030',
  Y2031 = '2031',
  Y2032 = '2032',
  Y2033 = '2033',
}

export enum Language {
  ENGLISH = 'en',
  HINDI = 'hi',
}

export enum SubscriptionPlan {
  FREE = 'free',
  PRO = 'pro',
  CRASH_COURSE = 'crash_course',
  INSTITUTE = 'institute', // paid by institute
}

@Entity('students')
export class Student extends Base {
  @Column({ name: 'institute_id' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'institute_id' })
  tenant: Tenant;

  @Column({ name: 'user_id', unique: true })
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // ── Academic profile ──────────────────────────────────────────────────────
  examTarget: string | ExamTarget = 'jee';

  class: StudentClass = StudentClass.CLASS_12;

  examYear: ExamYear = ExamYear.Y2026;

  targetCollege: string = ''; // e.g. "IIT Bombay CS"

  dailyStudyHours: number = 4;

  language: Language = Language.ENGLISH;

  // ── Personal details ─────────────────────────────────────────────────────
  careOf: string = ''; // Care of / Son of

  alternatePhoneNumber: string = '';

  // ── Location ─────────────────────────────────────────────────────────────
  @Column({ nullable: true })
  address: string;

  postOffice: string = '';

  @Column({ nullable: true })
  city: string;

  landmark: string = ''; // Landmark / Tehsil

  @Column({ nullable: true })
  state: string;

  @Column({ name: 'pin_code', nullable: true })
  pinCode: string;

  coachingName: string = '';

  // ── Gamification ──────────────────────────────────────────────────────────
  xpTotal: number = 0;

  leaderboardXpTotal: number = 0;

  leaderboardXpCycle: number = 0;

  mockXpTotal: number = 0;

  currentLevel: number = 1;

  currentStreak: number = 0;

  longestStreak: number = 0;

  lastActiveDate: string = '';

  // ── Subscription ──────────────────────────────────────────────────────────
  subscriptionPlan: SubscriptionPlan = SubscriptionPlan.FREE;

  subscriptionExpiresAt: Date = new Date();

  // ── Onboarding ────────────────────────────────────────────────────────────
  onboardingComplete: boolean = false;

  diagnosticCompleted: boolean = false;

  baselineRankEstimate: number = 0;

  // ── Parent ────────────────────────────────────────────────────────────────
  parentUserId: string = '';
}
