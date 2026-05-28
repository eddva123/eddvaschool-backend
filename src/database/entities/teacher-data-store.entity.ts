import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Base } from './base.entity';
import { Tenant } from './tenant.entity';

@Entity('teacher_data_stores')
@Index('IDX_teacher_data_stores_tenant_category', ['tenantId', 'category'])
export class TeacherDataStore extends Base {
  @Index('IDX_teacher_data_stores_tenant_id')
  @Column({
    name: 'tenant_id',
    type: 'uuid',
    nullable: true,
  })
  tenantId?: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Index('IDX_teacher_data_stores_category')
  @Column()
  category: string;

  @Column({ type: 'jsonb' })
  data: any;
}
