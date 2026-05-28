import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

import { CurrentUser, TenantId } from '../../common/decorators/auth.decorator';
import { CompatService } from './compat.service';

@ApiTags('Compat')
@ApiBearerAuth()
@Controller()
export class CompatController {
  constructor(private readonly compatService: CompatService) {}

  @Get('institutes')
  getInstitutes(@Query() query: Record<string, any>) {
    return this.compatService.listInstitutes(query);
  }

  @Post('institutes')
  createInstitute(@Body() body: Record<string, any>) {
    return this.compatService.createInstitute(body);
  }

  @Put('institutes/:id')
  updateInstitute(@Param('id') id: string, @Body() body: Record<string, any>) {
    return this.compatService.updateInstitute(id, body);
  }

  @Put('institutes/:id/:action')
  setInstituteStatus(@Param('id') id: string, @Param('action') action: string) {
    if (action === 'approve') return this.compatService.setInstituteStatus(id, 'ACTIVE');
    if (action === 'suspend') return this.compatService.setInstituteStatus(id, 'SUSPENDED');
    return this.compatService.setInstituteStatus(id, 'PENDING');
  }

  @Get('dashboard/stats')
  getDashboardStats(@CurrentUser() user: any, @Query('tenantId') queryTenantId: string) {
    return this.compatService.getPlatformStats(user?.tenantId || queryTenantId, user);
  }

  @Get('students')
  getStudents(@Query() query: Record<string, any>, @TenantId() tenantId: string) {
    if (!query.tenantId && tenantId) query.tenantId = tenantId;
    return this.compatService.getStudents(query);
  }

  @Post('students')
  createStudent(@Body() body: Record<string, any>, @CurrentUser() user: any, @TenantId() tenantId: string) {
    if (tenantId) body.tenantId = tenantId;
    return this.compatService.createStudent(body, user);
  }

  @Put('students/:id')
  updateStudent(@Param('id') id: string, @Body() body: Record<string, any>, @CurrentUser() user: any, @TenantId() tenantId: string) {
    if (tenantId) body.tenantId = tenantId;
    return this.compatService.updateStudent(id, body, user);
  }

  @Delete('students/:id')
  deleteStudent(@Param('id') id: string) {
    return this.compatService.deleteStudent(id);
  }

  @Get('teachers/announcements')
  @ApiTags('Teacher - Announcements')
  @ApiOperation({ summary: 'Get announcements for teacher (legacy/compat)' })
  getTeacherAnnouncements(@Query() query: Record<string, any>, @CurrentUser() user: any, @TenantId() tenantId: string) {
    if (!query.tenantId && tenantId) query.tenantId = tenantId;
    if (user && !user.tenantId && tenantId) user.tenantId = tenantId;
    return this.compatService.getTeacherAnnouncements(query, user);
  }

  @Get('teachers/:id')
  getTeacherDetail(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.compatService.getTeacherDetail(id, tenantId);
  }

  @Get('teachers')
  getTeachers(@Query() query: Record<string, any>, @TenantId() tenantId: string) {
    if (!query.tenantId && tenantId) query.tenantId = tenantId;
    return this.compatService.getTeachers(query);
  }

  @Post('teachers')
  createTeacher(@Body() body: Record<string, any>, @CurrentUser() user: any, @TenantId() tenantId: string) {
    if (tenantId) body.tenantId = tenantId;
    return this.compatService.createTeacher(body, user);
  }

  @Put('teachers/:id')
  updateTeacher(@Param('id') id: string, @Body() body: Record<string, any>, @CurrentUser() user: any, @TenantId() tenantId: string) {
    if (tenantId) body.tenantId = tenantId;
    return this.compatService.updateTeacher(id, body, user);
  }

  @Delete('teachers/:id')
  deleteTeacher(@Param('id') id: string) {
    return this.compatService.deleteTeacher(id);
  }

  @Get('notices')
  getNotices(@Query() query: Record<string, any>) {
    return this.compatService.getAnnouncements(query);
  }

  @Post('notices')
  createNotice(@Body() body: Record<string, any>) {
    return this.compatService.createNotice(body);
  }

  @Put('notices/:id')
  updateNotice(@Param('id') id: string, @Body() body: Record<string, any>) {
    return this.compatService.updateNotice(id, body);
  }

  @Delete('notices/:id')
  deleteNotice(@Param('id') id: string) {
    return this.compatService.deleteNotice(id);
  }

  @Get('fees')
  getFees(@Query() query: Record<string, any>) {
    return this.compatService.getFees(query);
  }

  @Get('fees/analytics')
  getFeesAnalytics(@Query() query: Record<string, any>) {
    return this.compatService.getFeeAnalytics(query);
  }

  @Post('fees/record')
  recordFeePayment(@Body() body: Record<string, any>) {
    return this.compatService.recordFeePayment(body);
  }

  @Get('chat/users')
  getChatUsers(@Query('role') role: string, @Query() query: Record<string, any>, @CurrentUser() user: any) {
    return this.compatService.getChatUsers(role, query, user);
  }

  @Get('chat/conversations')
  getChatConversations(@Query('role') role: string, @CurrentUser() user: any) {
    return this.compatService.getChatConversations(role, user);
  }

  @Get('chat/messages/:peerId')
  getChatMessages(@Param('peerId') peerId: string, @CurrentUser() user: any) {
    return this.compatService.getChatMessages(peerId, user);
  }

  @Post('chat/messages')
  sendChatMessage(@Body() body: Record<string, any>, @CurrentUser() user: any) {
    return this.compatService.sendChatMessage(body, user);
  }

  @Patch('chat/messages/:peerId/read')
  markChatMessagesRead(@Param('peerId') peerId: string, @CurrentUser() user: any) {
    return this.compatService.markChatAsRead(peerId, user);
  }

  @Get('complaints')
  getComplaints(@CurrentUser() user: any) {
    return this.compatService.getComplaints(user);
  }

  @Post('complaints')
  createComplaint(@Body() body: Record<string, any>, @CurrentUser() user: any) {
    return this.compatService.createComplaint(body, user);
  }

  @Put('complaints/:id')
  updateComplaint(@Param('id') id: string, @Body() body: Record<string, any>) {
    return this.compatService.updateComplaint(id, body);
  }

  @Get('admin/roles')
  getRoles() {
    return this.compatService.getRoles();
  }

  @Get('admin/audit-logs')
  getAuditLogs() {
    return this.compatService.getAuditLogs();
  }

  @Get('admin/security/score')
  getSecurityScore() {
    return this.compatService.getSecurityScore();
  }

  @Get('admin/security/sessions')
  getSecuritySessions() {
    return this.compatService.getSecuritySessions();
  }

  @Get('events')
  @ApiTags('Teacher - Live Classes')
  @ApiOperation({ summary: 'Get live class/calendar events' })
  getEvents(@Query() query: Record<string, any>, @CurrentUser() user: any) {
    return this.compatService.getEvents(query, user);
  }

  @Post('events')
  @ApiTags('Teacher - Live Classes')
  @ApiOperation({ summary: 'Create a new live class/calendar event' })
  createEvent(@Body() body: Record<string, any>, @CurrentUser() user: any) {
    return this.compatService.createEvent(body, user);
  }

  @Delete('events/:id')
  @ApiTags('Teacher - Live Classes')
  @ApiOperation({ summary: 'Delete a live class/calendar event' })
  deleteEvent(@Param('id') id: string) {
    return this.compatService.deleteEvent(id);
  }

  @Get('attendance')
  @ApiTags('Teacher - Attendance')
  @ApiOperation({ summary: 'Get attendance report (legacy/compat)' })
  getAttendance(@CurrentUser() user: any) {
    return this.compatService.getAttendanceReport(user);
  }

  @Post('attendance')
  @ApiTags('Teacher - Attendance')
  @ApiOperation({ summary: 'Mark student attendance (legacy/compat)' })
  markAttendanceLegacy(@Body() body: Record<string, any>, @CurrentUser() user: any) {
    return this.compatService.markAttendance(body, user);
  }

  // --- ACADEMIC CLASSES & SECTIONS (IN-MEMORY FOR UI COMPATIBILITY) ---
  @Get('academic/classes')
  getAcademicClasses(@CurrentUser() user: any) {
    return this.compatService.getAcademicClasses(user);
  }

  @Post('academic/classes')
  createAcademicClass(@Body() body: Record<string, any>, @CurrentUser() user: any) {
    return this.compatService.createAcademicClass(body, user);
  }

  @Put('academic/classes/:id')
  updateAcademicClass(@Param('id') id: string, @Body() body: Record<string, any>) {
    return this.compatService.updateAcademicClass(id, body);
  }

  @Delete('academic/classes/:id')
  deleteAcademicClass(@Param('id') id: string) {
    return this.compatService.deleteAcademicClass(id);
  }

  @Post('academic/classes/:classId/sections')
  createAcademicSection(@Param('classId') classId: string, @Body() body: Record<string, any>) {
    return this.compatService.createAcademicSection(classId, body);
  }

  @Put('academic/sections/:id')
  updateAcademicSection(@Param('id') id: string, @Body() body: Record<string, any>) {
    return this.compatService.updateAcademicSection(id, body);
  }

  @Delete('academic/sections/:id')
  deleteAcademicSection(@Param('id') id: string) {
    return this.compatService.deleteAcademicSection(id);
  }

  @Post('academic/sections/:id/subjects')
  assignAcademicSectionSubjects(@Param('id') id: string, @Body() body: Record<string, any>) {
    return this.compatService.assignAcademicSectionSubjects(id, body);
  }

  @Post('academic/classes/:id/subjects')
  assignAcademicClassSubjects(@Param('id') id: string, @Body() body: Record<string, any>) {
    return this.compatService.assignAcademicClassSubjects(id, body);
  }

  @Get('academic/subjects')
  getAcademicSubjects(@CurrentUser() user: any) {
    return this.compatService.getAcademicSubjects(user);
  }

  @Get('timetable')
  getTimetable(@CurrentUser() user: any) {
    return this.compatService.getTimetable(user);
  }

  // --- CLASSES SCHEDULES & RECORDINGS (IN-MEMORY FOR UI COMPATIBILITY) ---
  @Get('classes/schedules')
  @ApiTags('Teacher - Live Classes')
  @ApiOperation({ summary: 'Get live class schedules (legacy/compat)' })
  getSchedules(@CurrentUser() user: any) {
    return this.compatService.getSchedules(user);
  }

  @Post('classes/schedules')
  @ApiTags('Teacher - Live Classes')
  @ApiOperation({ summary: 'Create live class schedule (legacy/compat)' })
  createSchedule(@Body() body: Record<string, any>, @CurrentUser() user: any) {
    return this.compatService.createSchedule(body, user);
  }

  @Get('classes/recordings')
  @ApiTags('Teacher - Live Classes')
  @ApiOperation({ summary: 'Get class recordings (legacy/compat)' })
  getRecordings(@CurrentUser() user: any) {
    return this.compatService.getRecordings(user);
  }

  // --- TOPICS & MATERIALS (IN-MEMORY FOR UI COMPATIBILITY) ---
  @Get('topics')
  @ApiTags('Teacher - Creator Studio')
  @ApiOperation({ summary: 'Get creator studio topics (legacy/compat)' })
  getTopics(@CurrentUser() user: any) {
    return this.compatService.getTopics(user);
  }

  @Post('topics')
  @ApiTags('Teacher - Creator Studio')
  @ApiOperation({ summary: 'Create topic in creator studio (legacy/compat)' })
  createTopic(@Body() body: Record<string, any>, @CurrentUser() user: any) {
    return this.compatService.createTopic(body, user);
  }

  @Get('topics/:id')
  @ApiTags('Teacher - Creator Studio')
  @ApiOperation({ summary: 'Get creator studio topic by ID (legacy/compat)' })
  getTopicById(@Param('id') id: string) {
    return this.compatService.getTopicById(id);
  }

  @Post('topics/:id/chapters')
  @ApiTags('Teacher - Creator Studio')
  @ApiOperation({ summary: 'Create chapter in topic (legacy/compat)' })
  createTopicChapter(@Param('id') id: string, @Body() body: Record<string, any>) {
    return this.compatService.createTopicChapter(id, body);
  }

  @Post('materials')
  @ApiTags('Teacher - Creator Studio')
  @ApiOperation({ summary: 'Upload study material (legacy/compat)' })
  uploadMaterial(@Body() body: Record<string, any>) {
    return this.compatService.uploadMaterial(body);
  }

  // --- ASSESSMENTS ANALYTICS & LEADERBOARD (IN-MEMORY FOR UI COMPATIBILITY) ---
  @Get('assessments/:id/leaderboard')
  @ApiTags('Teacher - Assessments')
  @ApiOperation({ summary: 'Get assessment leaderboard (legacy/compat)' })
  getAssessmentLeaderboard(@Param('id') id: string) {
    return this.compatService.getAssessmentLeaderboard(id);
  }

  @Get('assessments/:id/analytics')
  @ApiTags('Teacher - Assessments')
  @ApiOperation({ summary: 'Get assessment analytics (legacy/compat)' })
  getAssessmentAnalytics(@Param('id') id: string) {
    return this.compatService.getAssessmentAnalytics(id);
  }

  // --- ASSIGNMENTS (IN-MEMORY FOR UI COMPATIBILITY) ---
  @Get('assignments')
  @ApiTags('Teacher - Assignments')
  @ApiOperation({ summary: 'Get assignments (legacy/compat)' })
  getAssignments(@CurrentUser() user: any) {
    return this.compatService.getAssignments(user);
  }

  @Post('assignments')
  @ApiTags('Teacher - Assignments')
  @ApiOperation({ summary: 'Create assignment (legacy/compat)' })
  createAssignment(@Body() body: Record<string, any>, @CurrentUser() user: any) {
    return this.compatService.createAssignment(body, user);
  }

  @Delete('assignments/:id')
  @ApiTags('Teacher - Assignments')
  @ApiOperation({ summary: 'Delete assignment (legacy/compat)' })
  deleteAssignment(@Param('id') id: string) {
    return this.compatService.deleteAssignment(id);
  }

  // --- ATTENDANCE (IN-MEMORY FOR UI COMPATIBILITY) ---
  @Get('attendance/report')
  @ApiTags('Teacher - Attendance')
  @ApiOperation({ summary: 'Get attendance report (legacy/compat)' })
  getAttendanceReport(@CurrentUser() user: any) {
    return this.compatService.getAttendanceReport(user);
  }

  @Get('attendance/students/:classId')
  @ApiTags('Teacher - Attendance')
  @ApiOperation({ summary: 'Get students for class attendance (legacy/compat)' })
  getAttendanceStudents(@Param('classId') classId: string, @CurrentUser() user: any) {
    return this.compatService.getAttendanceStudents(classId, user);
  }

  @Post('attendance/mark')
  @ApiTags('Teacher - Attendance')
  @ApiOperation({ summary: 'Mark class attendance (legacy/compat)' })
  markAttendance(@Body() body: Record<string, any>, @CurrentUser() user: any) {
    return this.compatService.markAttendance(body, user);
  }

  // --- GRIEVANCES (IN-MEMORY FOR UI COMPATIBILITY) ---
  @Get('grievances')
  getGrievances(@CurrentUser() user: any) {
    return this.compatService.getGrievances(user);
  }

  @Post('grievances')
  createGrievance(@Body() body: Record<string, any>, @CurrentUser() user: any) {
    return this.compatService.createGrievance(body, user);
  }
}