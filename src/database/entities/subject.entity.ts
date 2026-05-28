import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';

export enum ResourceType {
  PDF = 'pdf',
  DPP = 'dpp',
  PYQ = 'pyq',
  FAQ = 'faq',
  QUIZ = 'quiz',
  NOTES = 'notes',
  MINDMAP = 'mindmap',
  VIDEO = 'video',
  LINK = 'link',
}
import { Base, BaseWithDelete } from './base.entity';
import { Tenant } from './tenant.entity';

// ─── Subject ─────────────────────────────────────────────────────────────────
@Entity('subjects')
export class Subject extends Base {
  @Column({ name: 'institute_id' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'institute_id' })
  tenant: Tenant;

  @Column({ name: 'batch_id', type: 'uuid', nullable: true })
  batchId: string | null = null;

  @Column()
  name: string; // Physics, Chemistry, Mathematics, Biology

  @Column({ name: 'exam_target', type: 'varchar', length: 50, default: 'jee' })
  examTarget: string = 'jee';

  @Column({ type: 'varchar', length: 100, default: '' })
  icon: string = '';

  @Column({ name: 'color_code', type: 'varchar', length: 20, default: '' })
  colorCode: string = '';

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number = 0;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean = true;

  @OneToMany(() => Chapter, (c) => c.subject)
  chapters: Chapter[];
}

// ─── Chapter ──────────────────────────────────────────────────────────────────
@Entity('chapters')
export class Chapter extends Base {
  @Column({ name: 'institute_id' })
  tenantId: string;

  tenant: Tenant;

  @Column({ name: 'subject_id', type: 'uuid' })
  subjectId: string = '';

  @ManyToOne(() => Subject, (s) => s.chapters, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @Column()
  name: string; // e.g. "Thermodynamics"

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number = 0;

  @Column({ name: 'jee_weightage', type: 'float', default: 0 })
  jeeWeightage: number = 0;

  @Column({ name: 'neet_weightage', type: 'float', default: 0 })
  neetWeightage: number = 0;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean = true;

  @OneToMany(() => Topic, (t) => t.chapter)
  topics: Topic[];
}

// ─── Topic ────────────────────────────────────────────────────────────────────
@Entity('topics')
export class Topic extends Base {
  @Column({ name: 'institute_id' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'institute_id' })
  tenant: Tenant;

  @Column({ name: 'subject_id' })
  chapterId: string;

  @ManyToOne(() => Chapter, (c) => c.topics)
  @JoinColumn({ name: 'subject_id' })
  chapter: Chapter;

  @Column()
  name: string; // e.g. "Carnot Engine"

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number = 0;

  @Column({ name: 'gate_pass_percentage', type: 'int', default: 70 })
  gatePassPercentage: number = 70;

  @Column({ name: 'estimated_study_minutes', type: 'int', default: 60 })
  estimatedStudyMinutes: number = 60;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean = true;

  @Column({ name: 'prerequisite_topic_ids', type: 'simple-array', nullable: true })
  prerequisiteTopicIds: string[] = [];

  @OneToMany(() => TopicResource, (r) => r.topic)
  resources: TopicResource[];
}

// ─── TopicResource ────────────────────────────────────────────────────────────
@Entity('topic_resources')
export class TopicResource extends BaseWithDelete {
  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'topic_id' })
  topicId: string;

  @ManyToOne(() => Topic, (t) => t.resources, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'topic_id' })
  topic: Topic;

  @Column({ name: 'uploaded_by' })
  uploadedBy: string; // userId of institute admin

  @Column({ type: 'enum', enum: ResourceType })
  type: ResourceType; // pdf | dpp | pyq | quiz | notes | video | link

  @Column()
  title: string; // e.g. "DPP - Newton's Laws Set 1"

  @Column({ name: 'file_url', nullable: true })
  fileUrl: string | null; // S3 / local path (null for URL-only resources)

  @Column({ name: 'external_url', nullable: true })
  externalUrl: string | null; // YouTube link or any external URL

  @Column({ name: 'file_size_kb', nullable: true })
  fileSizeKb: number;

  @Column({ name: 'description', nullable: true })
  description: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
