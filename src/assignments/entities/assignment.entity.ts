import {
  Entity,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

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

  @Column({ default: 'homework' })
  type: string;

  @Column({ name: 'instructions', type: 'text', nullable: true })
  description: string;

  @Column({ name: 'class_id' })
  classId: string;

  @Column({ name: 'subject_id' })
  subjectId: string;

  @Column({ name: 'due_date', type: 'timestamptz', nullable: true })
  dueDate: Date;

  @Column({ name: 'file_path', nullable: true })
  filePath: string;

  @Column({ default: 'active' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}