import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TeacherAnalyticsService } from './teacher-analytics.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../database/entities/user.entity';

@ApiTags('Teacher - Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TEACHER, UserRole.INSTITUTE_ADMIN, UserRole.SUPER_ADMIN)
@Controller('teacher/analytics')
export class TeacherAnalyticsController {
  constructor(private readonly analyticsService: TeacherAnalyticsService) {}

  @Get('dashboard-metrics')
  @ApiOperation({ summary: 'Get general dashboard metrics' })
  async getDashboardMetrics(@Request() req) {
    return this.analyticsService.getDashboardMetrics(req.user.tenantId, req.user);
  }

  @Get('assessments/performance-summary')
  @ApiOperation({ summary: 'Get assessment performance summary' })
  async getAssessmentPerformanceSummary(@Request() req, @Query('assessmentId') assessmentId?: string) {
    return this.analyticsService.getAssessmentPerformanceSummary(req.user.tenantId, assessmentId);
  }

  @Get('assessments/score-distribution')
  @ApiOperation({ summary: 'Get assessment score distribution' })
  async getAssessmentScoreDistribution(@Request() req, @Query('assessmentId') assessmentId?: string) {
    return this.analyticsService.getAssessmentScoreDistribution(req.user.tenantId, assessmentId);
  }

  @Get('assessments/:assessmentId/section-performance')
  @ApiOperation({ summary: 'Get section-wise performance for an assessment' })
  async getSectionWisePerformance(@Request() req, @Param('assessmentId') assessmentId: string) {
    return this.analyticsService.getSectionWisePerformance(req.user.tenantId, assessmentId);
  }

  @Get('questions/difficulty-analysis')
  @ApiOperation({ summary: 'Get deterministic question difficulty analytics' })
  async getQuestionDifficultyAnalytics(@Request() req) {
    return this.analyticsService.getQuestionDifficultyAnalytics(req.user.tenantId);
  }

  @Get('class/performance-trends')
  @ApiOperation({ summary: 'Get class performance trends' })
  async getClassPerformanceTrends(@Request() req, @Query('timeframe') timeframe: 'weekly' | 'monthly' = 'monthly') {
    return this.analyticsService.getClassPerformanceTrends(req.user.tenantId, timeframe);
  }

  @Get('attendance/performance-correlation')
  @ApiOperation({ summary: 'Get correlation between attendance and performance' })
  async getAttendancePerformanceCorrelation(@Request() req) {
    return this.analyticsService.getAttendancePerformanceCorrelation(req.user.tenantId);
  }

  @Get('assignments/completion-trends')
  @ApiOperation({ summary: 'Get assignment completion trends over time' })
  async getAssignmentCompletionTrends(@Request() req) {
    return this.analyticsService.getAssignmentCompletionTrends(req.user.tenantId);
  }

  @Get('assignments/engagement')
  @ApiOperation({ summary: 'Get advanced assignment engagement analytics (heatmaps, late submissions, turnarounds)' })
  async getAssignmentEngagementAnalytics(@Request() req) {
    return this.analyticsService.getAssignmentEngagementAnalytics(req.user.tenantId);
  }

  @Get('engagement/metrics')
  @ApiOperation({ summary: 'Get overall student engagement metrics' })
  async getEngagementMetrics(@Request() req) {
    return this.analyticsService.getEngagementMetrics(req.user.tenantId);
  }
}
