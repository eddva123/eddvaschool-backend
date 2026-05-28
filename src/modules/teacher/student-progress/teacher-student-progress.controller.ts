import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TeacherStudentProgressService } from './teacher-student-progress.service';
import { StudentProgressQueryDto, StudentRankingQueryDto } from './dto/student-progress.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../database/entities/user.entity';

@ApiTags('Teacher - Student Progress')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TEACHER, UserRole.INSTITUTE_ADMIN, UserRole.SUPER_ADMIN)
@Controller('teacher/student-progress')
export class TeacherStudentProgressController {
  constructor(private readonly studentProgressService: TeacherStudentProgressService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get class progress summary' })
  async getClassProgressSummary(@Request() req, @Query() query: StudentProgressQueryDto) {
    const tenantId = req.user.tenantId;
    return this.studentProgressService.getClassProgressSummary(tenantId, query);
  }

  @Get('attendance-trend')
  @ApiOperation({ summary: 'Get class attendance trend' })
  async getAttendanceTrend(@Request() req, @Query() query: StudentProgressQueryDto) {
    const tenantId = req.user.tenantId;
    return this.studentProgressService.getAttendanceTrend(tenantId, query);
  }

  @Get('assignments')
  @ApiOperation({ summary: 'Get assignment completion stats by class' })
  async getAssignmentCompletionByClass(@Request() req, @Query() query: StudentProgressQueryDto) {
    const tenantId = req.user.tenantId;
    return this.studentProgressService.getAssignmentCompletionByClass(tenantId, query);
  }

  @Get('weak-areas')
  @ApiOperation({ summary: 'Get aggregated weak areas for a class' })
  async getWeakAreasForClass(@Request() req, @Query() query: StudentProgressQueryDto) {
    const tenantId = req.user.tenantId;
    return this.studentProgressService.getWeakAreasForClass(tenantId, query);
  }

  @Get('ranking')
  @ApiOperation({ summary: 'Get deterministic student ranking' })
  async getStudentRankingInClass(@Request() req, @Query() query: StudentRankingQueryDto) {
    const tenantId = req.user.tenantId;
    return this.studentProgressService.getStudentRankingInClass(tenantId, query);
  }

  @Get(':studentId/detail')
  @ApiOperation({ summary: 'Get detailed progress for a single student' })
  async getStudentProgressDetail(@Request() req, @Param('studentId') studentId: string) {
    const tenantId = req.user.tenantId;
    return this.studentProgressService.getStudentProgressDetail(tenantId, studentId);
  }
}
