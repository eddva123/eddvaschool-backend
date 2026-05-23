import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Base } from './base.entity';
import { Tenant } from './tenant.entity';
import { User } from './user.entity';

export enum ComplaintStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

@Entity('complaints')
export class Complaint extends Base {
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: ComplaintStatus, default: ComplaintStatus.OPEN })
  status: ComplaintStatus;

  @Index()
  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId?: string;

  @ManyToOne(() => Tenant, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant?: Tenant;

  @Index()
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
