import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/auth.decorator';
import { CompatService } from './compat.service';

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
    return this.compatService.getPlatformStats(user?.tenantId || queryTenantId);
  }

  @Get('students')
  getStudents(@Query() query: Record<string, any>) {
    return this.compatService.getStudents(query);
  }

  @Post('students')
  createStudent(@Body() body: Record<string, any>, @CurrentUser() user: any) {
    return this.compatService.createStudent(body, user);
  }

  @Put('students/:id')
  updateStudent(@Param('id') id: string, @Body() body: Record<string, any>, @CurrentUser() user: any) {
    return this.compatService.updateStudent(id, body, user);
  }

  @Delete('students/:id')
  deleteStudent(@Param('id') id: string) {
    return this.compatService.deleteStudent(id);
  }

  @Get('teachers')
  getTeachers(@Query() query: Record<string, any>) {
    return this.compatService.getTeachers(query);
  }

  @Post('teachers')
  createTeacher(@Body() body: Record<string, any>, @CurrentUser() user: any) {
    return this.compatService.createTeacher(body, user);
  }

  @Put('teachers/:id')
  updateTeacher(@Param('id') id: string, @Body() body: Record<string, any>, @CurrentUser() user: any) {
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
  getEvents(@Query() query: Record<string, any>, @CurrentUser() user: any) {
    return this.compatService.getEvents(query, user);
  }

  @Post('events')
  createEvent(@Body() body: Record<string, any>, @CurrentUser() user: any) {
    return this.compatService.createEvent(body, user);
  }

  @Delete('events/:id')
  deleteEvent(@Param('id') id: string) {
    return this.compatService.deleteEvent(id);
  }

  @Get('attendance')
  getAttendance(@CurrentUser() user: any) {
    return this.compatService.getAttendanceReport(user);
  }

  @Post('attendance')
  markAttendance(@Body() body: Record<string, any>, @CurrentUser() user: any) {
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
  getSchedules(@CurrentUser() user: any) {
    return this.compatService.getSchedules(user);
  }

  @Post('classes/schedules')
  createSchedule(@Body() body: Record<string, any>, @CurrentUser() user: any) {
    return this.compatService.createSchedule(body, user);
  }

  @Get('classes/recordings')
  getRecordings(@CurrentUser() user: any) {
    return this.compatService.getRecordings(user);
  }

  // --- TOPICS & MATERIALS (IN-MEMORY FOR UI COMPATIBILITY) ---
  @Get('topics')
  getTopics(@CurrentUser() user: any) {
    return this.compatService.getTopics(user);
  }

  @Post('topics')
  createTopic(@Body() body: Record<string, any>, @CurrentUser() user: any) {
    return this.compatService.createTopic(body, user);
  }

  @Get('topics/:id')
  getTopicById(@Param('id') id: string) {
    return this.compatService.getTopicById(id);
  }

  @Post('topics/:id/chapters')
  createTopicChapter(@Param('id') id: string, @Body() body: Record<string, any>) {
    return this.compatService.createTopicChapter(id, body);
  }

  @Post('materials')
  uploadMaterial(@Body() body: Record<string, any>) {
    return this.compatService.uploadMaterial(body);
  }

  // --- ASSESSMENTS ANALYTICS & LEADERBOARD (IN-MEMORY FOR UI COMPATIBILITY) ---
  @Get('assessments/:id/leaderboard')
  getAssessmentLeaderboard(@Param('id') id: string) {
    return this.compatService.getAssessmentLeaderboard(id);
  }

  @Get('assessments/:id/analytics')
  getAssessmentAnalytics(@Param('id') id: string) {
    return this.compatService.getAssessmentAnalytics(id);
  }

  // --- ASSIGNMENTS (IN-MEMORY FOR UI COMPATIBILITY) ---
  @Get('assignments')
  getAssignments(@CurrentUser() user: any) {
    return this.compatService.getAssignments(user);
  }

  @Post('assignments')
  createAssignment(@Body() body: Record<string, any>, @CurrentUser() user: any) {
    return this.compatService.createAssignment(body, user);
  }

  @Delete('assignments/:id')
  deleteAssignment(@Param('id') id: string) {
    return this.compatService.deleteAssignment(id);
  }

  // --- ATTENDANCE (IN-MEMORY FOR UI COMPATIBILITY) ---
  @Get('attendance/report')
  getAttendanceReport(@CurrentUser() user: any) {
    return this.compatService.getAttendanceReport(user);
  }

  @Get('attendance/students/:classId')
  getAttendanceStudents(@Param('classId') classId: string, @CurrentUser() user: any) {
    return this.compatService.getAttendanceStudents(classId, user);
  }

  @Post('attendance/mark')
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