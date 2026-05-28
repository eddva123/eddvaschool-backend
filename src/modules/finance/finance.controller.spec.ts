import { Test, TestingModule } from '@nestjs/testing';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';

const mockFinanceService = () => ({
  getAllFees: jest.fn(),
  createFee: jest.fn(),
  getTransactions: jest.fn(),
  recordTransaction: jest.fn(),
});

describe('FinanceController', () => {
  let controller: FinanceController;
  let service: ReturnType<typeof mockFinanceService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinanceController],
      providers: [
        { provide: FinanceService, useFactory: mockFinanceService },
      ],
    }).compile();

    controller = module.get<FinanceController>(FinanceController);
    service = module.get(FinanceService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllFees', () => {
    it('should delegate to financeService.getAllFees', async () => {
      const mockFees = [{ id: '1' }];
      service.getAllFees.mockResolvedValue(mockFees);

      const result = await controller.getAllFees('tenant-1');

      expect(service.getAllFees).toHaveBeenCalledWith('tenant-1');
      expect(result).toEqual(mockFees);
    });
  });

  describe('createFee', () => {
    it('should delegate to financeService.createFee', async () => {
      const data = { studentId: 's1', title: 'Fee', amount: 100 };
      service.createFee.mockResolvedValue({ id: 'fee-1', ...data });

      const result = await controller.createFee('tenant-1', data);

      expect(service.createFee).toHaveBeenCalledWith('tenant-1', data);
      expect(result).toHaveProperty('id', 'fee-1');
    });
  });

  describe('getTransactions', () => {
    it('should delegate to financeService.getTransactions', async () => {
      const mockTxs = [{ id: 'tx-1' }];
      service.getTransactions.mockResolvedValue(mockTxs);

      const result = await controller.getTransactions('tenant-1');

      expect(service.getTransactions).toHaveBeenCalledWith('tenant-1');
      expect(result).toEqual(mockTxs);
    });
  });

  describe('recordTransaction', () => {
    it('should delegate to financeService.recordTransaction', async () => {
      const data = { amount: 200, paymentMethod: 'UPI' };
      service.recordTransaction.mockResolvedValue({ id: 'tx-2' });

      const result = await controller.recordTransaction('tenant-1', 'fee-1', data);

      expect(service.recordTransaction).toHaveBeenCalledWith('tenant-1', 'fee-1', data);
      expect(result).toHaveProperty('id', 'tx-2');
    });
  });
});
