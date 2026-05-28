import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/auth.decorator';
import { UserRole } from '../../../database/entities/user.entity';
import { TeacherAssignmentsService } from './teacher-assignments.service';
import { CreateAssignmentDto, GradeSubmissionDto, SubmitAssignmentDto, UpdateAssignmentStatusDto, ScheduleAssignmentDto, SetRubricDto } from './dto/assignment.dto';

@ApiTags('Teacher - Assignments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TEACHER)
@Controller('teacher/assignments')
export class TeacherAssignmentsController {
  constructor(private readonly assignmentsService: TeacherAssignmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all assignments for the tenant' })
  getAssignments(@CurrentUser() user: any) {
    return this.assignmentsService.getAssignments(user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new assignment' })
  createAssignment(@Body() dto: CreateAssignmentDto, @CurrentUser() user: any) {
    return this.assignmentsService.createAssignment(dto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete an assignment' })
  @ApiParam({ name: 'id', description: 'Assignment ID' })
  deleteAssignment(@Param('id') id: string, @CurrentUser() user: any) {
    return this.assignmentsService.deleteAssignment(id, user);
  }

  @Post(':id/status')
  @ApiOperation({ summary: 'Update assignment status' })
  @ApiParam({ name: 'id', description: 'Assignment ID' })
  updateAssignmentStatus(@Param('id') id: string, @Body() dto: UpdateAssignmentStatusDto, @CurrentUser() user: any) {
    return this.assignmentsService.updateAssignmentStatus(id, dto.status, user);
  }

  @Post(':id/schedule')
  @ApiOperation({ summary: 'Schedule an assignment for future publishing' })
  @ApiParam({ name: 'id', description: 'Assignment ID' })
  scheduleAssignment(@Param('id') id: string, @Body() dto: ScheduleAssignmentDto, @CurrentUser() user: any) {
    return this.assignmentsService.scheduleAssignment(id, new Date(dto.publishAt), user);
  }

  @Get(':id/rubric')
  @ApiOperation({ summary: 'Get assignment rubric criteria' })
  @ApiParam({ name: 'id', description: 'Assignment ID' })
  getRubric(@Param('id') id: string, @CurrentUser() user: any) {
    return this.assignmentsService.getRubric(id, user);
  }

  @Post(':id/rubric')
  @ApiOperation({ summary: 'Set or update assignment rubric criteria' })
  @ApiParam({ name: 'id', description: 'Assignment ID' })
  setRubric(@Param('id') id: string, @Body() dto: SetRubricDto, @CurrentUser() user: any) {
    return this.assignmentsService.setRubric(id, dto.criteria, user);
  }

  @Get(':id/submissions')
  @ApiOperation({ summary: 'Get submissions for an assignment' })
  @ApiParam({ name: 'id', description: 'Assignment ID' })
  getSubmissions(@Param('id') id: string, @CurrentUser() user: any) {
    return this.assignmentsService.getSubmissions(id, user);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit an assignment (e.g. on behalf of student or for testing)' })
  @ApiParam({ name: 'id', description: 'Assignment ID' })
  submitAssignment(@Param('id') id: string, @Body() dto: SubmitAssignmentDto, @CurrentUser() user: any) {
    return this.assignmentsService.submitAssignment(id, dto, user);
  }

  @Post('submissions/:submissionId/grade')
  @ApiOperation({ summary: 'Grade a submission' })
  @ApiParam({ name: 'submissionId', description: 'Submission ID' })
  gradeSubmission(@Param('submissionId') submissionId: string, @Body() dto: GradeSubmissionDto, @CurrentUser() user: any) {
    return this.assignmentsService.gradeSubmission(submissionId, dto, user);
  }
}
