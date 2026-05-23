import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fee, Transaction, FeeStatus } from '../../database/entities/finance.entity';
import { TenantService } from '../../common/middleware/tenant.middleware';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(Fee)
    private readonly feeRepository: Repository<Fee>,
    @InjectRepository(Transaction)
    private readonly txRepository: Repository<Transaction>,
  ) {}

  async getAllFees(tenantId: string) {
    return this.feeRepository.find({
      where: { tenantId },
      relations: ['student', 'student.user'],
      order: { createdAt: 'DESC' },
    });
  }

  async createFee(tenantId: string, data: any) {
    const fee = this.feeRepository.create({
      tenantId,
      studentId: data.studentId,
      title: data.title,
      amount: data.amount,
      dueDate: data.dueDate,
      status: FeeStatus.PENDING,
    });
    return this.feeRepository.save(fee);
  }

  async getTransactions(tenantId: string) {
    return this.txRepository.find({
      where: { tenantId },
      relations: ['fee', 'fee.student', 'fee.student.user'],
      order: { transactionDate: 'DESC' },
    });
  }

  async recordTransaction(tenantId: string, feeId: string, data: any) {
    const fee = await this.feeRepository.findOne({ where: { id: feeId, tenantId } });
    if (!fee) throw new NotFoundException('Fee not found');

    const tx = this.txRepository.create({
      tenantId,
      feeId,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      referenceNumber: data.referenceNumber,
    });

    await this.txRepository.save(tx);

    fee.amountPaid += Number(data.amount);
    if (fee.amountPaid >= fee.amount) {
      fee.status = FeeStatus.PAID;
    } else if (fee.amountPaid > 0) {
      fee.status = FeeStatus.PARTIAL;
    }
    await this.feeRepository.save(fee);

    return tx;
  }
}
