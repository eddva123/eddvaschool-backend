import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/auth.decorator';
import { UserRole } from '../../../database/entities/user.entity';
import { TeacherAttendanceService } from './teacher-attendance.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';

@ApiTags('Teacher - Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TEACHER)
@Controller('teacher/attendance')
export class TeacherAttendanceController {
  constructor(private readonly attendanceService: TeacherAttendanceService) {}

  @Get('report')
  @ApiOperation({ summary: 'Get teacher attendance report for their tenant' })
  getAttendanceReport(@CurrentUser() user: any) {
    return this.attendanceService.getAttendanceReport(user);
  }

  @Get('students/:classId')
  @ApiOperation({ summary: 'Get students eligible for attendance in a class' })
  @ApiParam({ name: 'classId', description: 'Class identifier' })
  getAttendanceStudents(@Param('classId') classId: string, @CurrentUser() user: any) {
    return this.attendanceService.getAttendanceStudents(classId, user);
  }

  @Post('mark')
  @ApiOperation({ summary: 'Mark attendance for a student' })
  markAttendance(@Body() dto: MarkAttendanceDto, @CurrentUser() user: any) {
    return this.attendanceService.markAttendance(dto, user);
  }
}
