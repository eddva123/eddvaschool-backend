import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { Fee, Transaction } from '../../database/entities/finance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Fee, Transaction])],
  controllers: [FinanceController],
  providers: [FinanceService]
})
export class FinanceModule {}
