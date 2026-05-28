import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

import { CurrentUser, TenantId } from '../../common/decorators/auth.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompatService } from './compat.service';

@ApiTags('Compat')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class CompatController {
  constructor(private readonly compatService: CompatService) { }

  @Get('institutes')
  getInstitutes(@Query() query: Record<string, any>) {
    return this.compatService.listInstitutes(query);
  }

  @Post('institutes')
  createInstitute(@Body() body: Record<string, any>) {
    return this.compatService.createInstitute(body);
  }

  @Put('institutes/:id')
  updateInstitute(
    @Param('id') id: string,
    @Body() body: Record<string, any>,
  ) {
    return this.compatService.updateInstitute(id, body);
  }

  @Put('institutes/:id/:action')
  setInstituteStatus(
    @Param('id') id: string,
    @Param('action') action: string,
  ) {
    if (action === 'approve')
      return this.compatService.setInstituteStatus(id, 'ACTIVE');

    if (action === 'suspend')
      return this.compatService.setInstituteStatus(id, 'SUSPENDED');

    return this.compatService.setInstituteStatus(id, 'PENDING');
  }

  @Get('dashboard/stats')
  getDashboardStats(
    @CurrentUser() user: any,
    @Query('tenantId') queryTenantId: string,
  ) {
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';

    const tenantId = isSuperAdmin
      ? queryTenantId || undefined
      : user?.tenantId || queryTenantId;

    return this.compatService.getPlatformStats(tenantId);
  }

  @Get('students')
  getStudents(
    @Query() query: Record<string, any>,
    @TenantId() tenantId: string,
  ) {
    if (!query.tenantId && tenantId) query.tenantId = tenantId;

    return this.compatService.getStudents(query);
  }

  @Post('students')
  createStudent(
    @Body() body: Record<string, any>,
    @CurrentUser() user: any,
    @TenantId() tenantId: string,
  ) {
    if (tenantId) body.tenantId = tenantId;

    return this.compatService.createStudent(body, user);
  }

  @Put('students/:id')
  updateStudent(
    @Param('id') id: string,
    @Body() body: Record<string, any>,
    @CurrentUser() user: any,
    @TenantId() tenantId: string,
  ) {
    if (tenantId) body.tenantId = tenantId;

    return this.compatService.updateStudent(id, body, user);
  }

  @Delete('students/:id')
  deleteStudent(@Param('id') id: string) {
    return this.compatService.deleteStudent(id);
  }

  @Get('teachers/announcements')
  @ApiOperation({
    summary: 'Get announcements for teacher (legacy/compat)',
  })
  getTeacherAnnouncements(
    @Query() query: Record<string, any>,
    @CurrentUser() user: any,
    @TenantId() tenantId: string,
  ) {
    if (!query.tenantId && tenantId) query.tenantId = tenantId;

    if (user && !user.tenantId && tenantId) {
      user.tenantId = tenantId;
    }

    return this.compatService.getTeacherAnnouncements(query, user);
  }
}