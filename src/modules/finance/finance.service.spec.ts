import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { Fee, Transaction, FeeStatus } from '../../database/entities/finance.entity';

const mockFeeRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockTxRepository = () => ({
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

describe('FinanceService', () => {
  let service: FinanceService;
  let feeRepo: ReturnType<typeof mockFeeRepository>;
  let txRepo: ReturnType<typeof mockTxRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceService,
        { provide: getRepositoryToken(Fee), useFactory: mockFeeRepository },
        { provide: getRepositoryToken(Transaction), useFactory: mockTxRepository },
      ],
    }).compile();

    service = module.get<FinanceService>(FinanceService);
    feeRepo = module.get(getRepositoryToken(Fee));
    txRepo = module.get(getRepositoryToken(Transaction));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllFees', () => {
    it('should return fees for the given tenant', async () => {
      const mockFees = [{ id: '1', title: 'Tuition' }];
      feeRepo.find.mockResolvedValue(mockFees);

      const result = await service.getAllFees('tenant-1');

      expect(feeRepo.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        relations: ['student', 'student.user'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockFees);
    });
  });

  describe('createFee', () => {
    it('should create and save a new fee', async () => {
      const data = { studentId: 's1', title: 'Lab Fee', amount: 500, dueDate: '2026-06-01' };
      const created = { ...data, tenantId: 'tenant-1', status: FeeStatus.PENDING };
      feeRepo.create.mockReturnValue(created);
      feeRepo.save.mockResolvedValue({ id: 'fee-1', ...created });

      const result = await service.createFee('tenant-1', data);

      expect(feeRepo.create).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        studentId: 's1',
        title: 'Lab Fee',
        amount: 500,
        dueDate: '2026-06-01',
        status: FeeStatus.PENDING,
      });
      expect(feeRepo.save).toHaveBeenCalledWith(created);
      expect(result).toHaveProperty('id', 'fee-1');
    });
  });

  describe('getTransactions', () => {
    it('should return transactions for the given tenant', async () => {
      const mockTxs = [{ id: 'tx-1' }];
      txRepo.find.mockResolvedValue(mockTxs);

      const result = await service.getTransactions('tenant-1');

      expect(txRepo.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        relations: ['fee', 'fee.student', 'fee.student.user'],
        order: { transactionDate: 'DESC' },
      });
      expect(result).toEqual(mockTxs);
    });
  });

  describe('recordTransaction', () => {
    it('should throw NotFoundException when fee does not exist', async () => {
      feeRepo.findOne.mockResolvedValue(null);

      await expect(
        service.recordTransaction('tenant-1', 'bad-id', { amount: 100 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should record a transaction and update fee status to PAID when fully paid', async () => {
      const fee = { id: 'fee-1', tenantId: 'tenant-1', amount: 500, amountPaid: 400, status: FeeStatus.PARTIAL };
      feeRepo.findOne.mockResolvedValue(fee);
      const txData = { amount: 100, paymentMethod: 'UPI', referenceNumber: 'REF-1' };
      const createdTx = { ...txData, tenantId: 'tenant-1', feeId: 'fee-1' };
      txRepo.create.mockReturnValue(createdTx);
      txRepo.save.mockResolvedValue({ id: 'tx-1', ...createdTx });

      await service.recordTransaction('tenant-1', 'fee-1', txData);

      expect(fee.amountPaid).toBe(500);
      expect(fee.status).toBe(FeeStatus.PAID);
      expect(feeRepo.save).toHaveBeenCalledWith(fee);
    });

    it('should set fee status to PARTIAL for partial payment', async () => {
      const fee = { id: 'fee-1', tenantId: 'tenant-1', amount: 500, amountPaid: 0, status: FeeStatus.PENDING };
      feeRepo.findOne.mockResolvedValue(fee);
      const txData = { amount: 200, paymentMethod: 'Cash', referenceNumber: 'REF-2' };
      txRepo.create.mockReturnValue({ ...txData, tenantId: 'tenant-1', feeId: 'fee-1' });
      txRepo.save.mockResolvedValue({ id: 'tx-2' });

      await service.recordTransaction('tenant-1', 'fee-1', txData);

      expect(fee.amountPaid).toBe(200);
      expect(fee.status).toBe(FeeStatus.PARTIAL);
    });
  });
});
