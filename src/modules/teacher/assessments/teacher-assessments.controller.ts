import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/auth.decorator';
import { UserRole } from '../../../database/entities/user.entity';
import { TeacherAssessmentsService } from './teacher-assessments.service';
import { AddAssessmentQuestionDto, SubmitAttemptDto } from './dto/assessment-question.dto';

@ApiTags('Teacher - Assessments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('teacher/assessments')
export class TeacherAssessmentsController {
  constructor(private readonly assessmentsService: TeacherAssessmentsService) {}

  @Post(':id/questions')
  @Roles(UserRole.TEACHER)
  @ApiOperation({ summary: 'Link a question to a teacher assessment' })
  addQuestion(
    @Param('id') assessmentId: string,
    @Body() dto: AddAssessmentQuestionDto,
    @CurrentUser() user: any,
  ) {
    return this.assessmentsService.addQuestion(assessmentId, dto, user);
  }

  @Delete(':id/questions/:questionId')
  @Roles(UserRole.TEACHER)
  @ApiOperation({ summary: 'Unlink a question from a teacher assessment' })
  removeQuestion(
    @Param('id') assessmentId: string,
    @Param('questionId') questionId: string,
    @CurrentUser() user: any,
  ) {
    return this.assessmentsService.removeQuestion(assessmentId, questionId, user);
  }

  @Get(':id/questions')
  @Roles(UserRole.TEACHER, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get list of questions linked to a teacher assessment' })
  getAssessmentQuestions(
    @Param('id') assessmentId: string,
    @CurrentUser() user: any,
  ) {
    return this.assessmentsService.getAssessmentQuestions(assessmentId, user);
  }

  @Post(':id/attempts/start')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Start a student attempt on a teacher assessment' })
  startAttempt(
    @Param('id') assessmentId: string,
    @CurrentUser() user: any,
  ) {
    return this.assessmentsService.startAttempt(assessmentId, user.id, user.tenantId);
  }

  @Post('attempts/:attemptId/submit')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Submit answers for an active assessment attempt' })
  submitAttempt(
    @Param('attemptId') attemptId: string,
    @Body() dto: SubmitAttemptDto,
    @CurrentUser() user: any,
  ) {
    return this.assessmentsService.submitAttempt(attemptId, dto, user.tenantId);
  }

  @Get('attempts/:attemptId/result')
  @Roles(UserRole.TEACHER, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get student attempt result details and auto-graded breakdown' })
  getAttemptResult(
    @Param('attemptId') attemptId: string,
    @CurrentUser() user: any,
  ) {
    return this.assessmentsService.getAttemptResult(attemptId, user.tenantId);
  }
}
