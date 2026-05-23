import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Base } from './base.entity';
import { Tenant } from './tenant.entity';
import { Student } from './student.entity';

export enum FeeStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  PARTIAL = 'partial'
}

@Entity('fees')
export class Fee extends Base {
  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'student_id' })
  studentId: string;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column()
  title: string;

  @Column({ type: 'float' })
  amount: number;

  @Column({ name: 'amount_paid', type: 'float', default: 0 })
  amountPaid: number;

  @Column({ name: 'due_date', type: 'timestamptz' })
  dueDate: Date;

  @Column({ type: 'enum', enum: FeeStatus, default: FeeStatus.PENDING })
  status: FeeStatus;
}

@Entity('transactions')
export class Transaction extends Base {
  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'fee_id' })
  feeId: string;

  @ManyToOne(() => Fee)
  @JoinColumn({ name: 'fee_id' })
  fee: Fee;

  @Column({ type: 'float' })
  amount: number;

  @Column({ name: 'payment_method' })
  paymentMethod: string;

  @Column({ name: 'transaction_date', type: 'timestamptz', default: () => 'NOW()' })
  transactionDate: Date;

  @Column({ name: 'reference_number', nullable: true })
  referenceNumber: string;
}
