import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/auth.decorator';
import { UserRole } from '../../../database/entities/user.entity';
import { TeacherAnnouncementService } from './teacher-announcement.service';
import { AnnouncementQueryDto } from './dto/announcement-query.dto';

@ApiTags('Teacher - Announcements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TEACHER)
@Controller('teacher/announcements')
export class TeacherAnnouncementController {
  constructor(private readonly announcementService: TeacherAnnouncementService) {}

  @Get()
  @ApiOperation({ summary: 'Get announcements for the logged-in teacher' })
  getAnnouncements(@Query() query: AnnouncementQueryDto, @CurrentUser() user: any) {
    return this.announcementService.getAnnouncementsForTeacher(query, user);
  }
}
