import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Base } from './base.entity';
import { Tenant } from './tenant.entity';
import { Assignment } from '../../assignments/entities/assignment.entity';

@Entity('assignment_rubrics')
@Index('IDX_rubric_tenant_assignment', ['tenantId', 'assignmentId'])
export class AssignmentRubric extends Base {
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

  @Column()
  criterion: string; // e.g. "Accuracy", "Presentation"

  @Column({ name: 'max_score', type: 'float', default: 10 })
  maxScore: number;

  @Column({ type: 'float', default: 100 })
  weight: number; // percentage weight

  @Column({ type: 'text', nullable: true })
  description: string;
}
