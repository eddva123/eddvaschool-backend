import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../database/entities/user.entity';
import { TenantId } from '../../common/decorators/auth.decorator';

@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('fees')
  @Roles(UserRole.INSTITUTE_ADMIN, UserRole.SUPER_ADMIN)
  async getAllFees(@TenantId() tenantId: string) {
    return this.financeService.getAllFees(tenantId);
  }

  @Post('fees')
  @Roles(UserRole.INSTITUTE_ADMIN, UserRole.SUPER_ADMIN)
  async createFee(@TenantId() tenantId: string, @Body() data: any) {
    return this.financeService.createFee(tenantId, data);
  }

  @Get('transactions')
  @Roles(UserRole.INSTITUTE_ADMIN, UserRole.SUPER_ADMIN)
  async getTransactions(@TenantId() tenantId: string) {
    return this.financeService.getTransactions(tenantId);
  }

  @Post('fees/:id/pay')
  @Roles(UserRole.INSTITUTE_ADMIN, UserRole.SUPER_ADMIN, UserRole.STUDENT)
  async recordTransaction(@TenantId() tenantId: string, @Param('id') feeId: string, @Body() data: any) {
    return this.financeService.recordTransaction(tenantId, feeId, data);
  }
}
