import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Not, Repository, IsNull } from 'typeorm';

import { Announcement } from '../../database/entities/announcement.entity';
import { Enrollment } from '../../database/entities/batch.entity';
import { Student } from '../../database/entities/student.entity';
import { Tenant, TenantPlan, TenantStatus } from '../../database/entities/tenant.entity';
import { TeacherProfile } from '../../database/entities/teacher.entity';
import { User, UserRole, UserStatus } from '../../database/entities/user.entity';
import { Complaint, ComplaintStatus } from '../../database/entities/complaint.entity';

type ChatMessageRecord = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  createdAt: string;
  readAt: string | null;
};



type NoticeExtras = {
  category?: string;
  priority?: string;
  postedDate?: string;
  expiryDate?: string;
  targetRoles?: string[];
  attachments?: Record<string, string>;
};

@Injectable()
export class CompatService {
  private readonly noticeExtras = new Map<string, NoticeExtras>();
  private readonly chatMessages: ChatMessageRecord[] = [];
  private readonly academicClasses: any[] = [];
  private readonly schedules: any[] = [];
  private readonly recordings: any[] = [];
  private readonly events: any[] = [];
  private readonly topics: any[] = [];
  private readonly materials: any[] = [];
  private readonly assignments: any[] = [];
  private readonly attendanceRecords: any[] = [
    { studentId: 'S001', name: 'Alice Johnson', className: '12-A', present: 22, absent: 2, late: 1, percentage: 92 },
    { studentId: 'S002', name: 'Bob Smith', className: '12-A', present: 20, absent: 4, late: 2, percentage: 83 },
    { studentId: 'S003', name: 'Charlie Brown', className: '12-A', present: 24, absent: 0, late: 0, percentage: 100 },
    { studentId: 'S004', name: 'Diana Prince', className: '12-A', present: 18, absent: 6, late: 3, percentage: 75 },
    { studentId: 'S005', name: 'Evan Wright', className: '12-A', present: 21, absent: 3, late: 1, percentage: 88 }
  ];
  private readonly grievances: any[] = [];

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Announcement) private readonly announcementRepo: Repository<Announcement>,
    @InjectRepository(Enrollment) private readonly enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
    @InjectRepository(TeacherProfile) private readonly teacherProfileRepo: Repository<TeacherProfile>,
    @InjectRepository(Complaint) private readonly complaintRepo: Repository<Complaint>,
  ) {}

  async listInstitutes(query: Record<string, any>) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.perPage || query.limit || 20)));
    const skip = (page - 1) * limit;
    const status = typeof query.status === 'string' && query.status !== 'ALL' ? this.toTenantStatus(query.status) : undefined;
    const search = typeof query.search === 'string' ? query.search.trim() : '';

    const qb = this.tenantRepo.createQueryBuilder('tenant').where('tenant.deleted_at IS NULL');
    if (status) {
      qb.andWhere('tenant.status = :status', { status });
    }
    if (search) {
      qb.andWhere('(tenant.name ILIKE :search OR tenant.subdomain ILIKE :search)', { search: `%${search}%` });
    }

    qb.orderBy('tenant.createdAt', 'DESC').skip(skip).take(limit);
    const [tenants, total] = await qb.getManyAndCount();

    const items = await Promise.all(tenants.map((tenant) => this.toInstituteView(tenant)));

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 0 },
    };
  }

  async createInstitute(payload: Record<string, any>) {
    const name = (payload.name || payload.instituteName || 'Untitled Institute').trim();
    const subdomain = this.slugify(payload.tenantDomain || payload.subdomain || payload.instituteName || payload.name || 'institute');

    const existing = await this.tenantRepo.findOne({
      where: [
        { name, deletedAt: IsNull() },
        { subdomain, deletedAt: IsNull() },
      ],
    });
    if (existing) {
      throw new ConflictException(existing.name === name ? 'Institute name already exists' : 'Subdomain already exists');
    }

    const tenant = this.tenantRepo.create({
      name,
      subdomain,
      status: this.toTenantStatus(payload.status || 'PENDING'),
      plan: this.toTenantPlan(payload.subscriptionPlan || payload.plan),
      city: payload.city || null,
      state: payload.state || null,
      billingEmail: payload.adminEmail || payload.email || null,
      metadata: this.buildTenantMetadata(payload),
    });

    const saved = await this.tenantRepo.save(tenant);
    await this.upsertInstituteAdmin(saved.id, payload);
    return this.toInstituteView(saved);
  }

  async updateInstitute(id: string, payload: Record<string, any>) {
    const tenant = await this.tenantRepo.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException(`Tenant ${id} not found`);

    const nextName = (payload.name || payload.instituteName || tenant.name).trim();
    const nextSubdomain = this.slugify(payload.tenantDomain || payload.subdomain || tenant.subdomain || nextName);

    const duplicate = await this.tenantRepo.findOne({
      where: [
        { id: Not(id), name: nextName, deletedAt: IsNull() },
        { id: Not(id), subdomain: nextSubdomain, deletedAt: IsNull() },
      ],
    });
    if (duplicate) {
      throw new ConflictException(duplicate.name === nextName ? 'Institute name already exists' : 'Subdomain already exists');
    }

    tenant.name = nextName;
    tenant.subdomain = nextSubdomain;
    tenant.status = this.toTenantStatus(payload.status || tenant.status);
    tenant.plan = this.toTenantPlan(payload.subscriptionPlan || payload.plan || tenant.plan);
    tenant.city = payload.city ?? tenant.city;
    tenant.state = payload.state ?? tenant.state;
    tenant.billingEmail = payload.adminEmail || payload.email || tenant.billingEmail;
    tenant.metadata = this.buildTenantMetadata({ ...(tenant.metadata || {}), ...payload });

    const saved = await this.tenantRepo.save(tenant);
    await this.upsertInstituteAdmin(saved.id, payload);
    return this.toInstituteView(saved);
  }

  async setInstituteStatus(id: string, status: 'ACTIVE' | 'PENDING' | 'SUSPENDED') {
    const tenant = await this.tenantRepo.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException(`Tenant ${id} not found`);

    tenant.status = this.toTenantStatus(status);
    const saved = await this.tenantRepo.save(tenant);
    return { institute: await this.toInstituteView(saved) };
  }

  async getPlatformStats(tenantId?: string) {
    const userWhere = tenantId ? { tenantId } : {};
    const enrollmentWhere = tenantId ? { tenantId, deletedAt: IsNull() } : { deletedAt: IsNull() };
    const studentQuery = tenantId ? 'SELECT COUNT(s.id)::int AS count FROM students s JOIN users u ON u.id = s.user_id WHERE u.institute_id = $1' : 'SELECT COUNT(*)::int AS count FROM students';
    const studentParams = tenantId ? [tenantId] : [];

    const [tenants, users, students, enrollments] = await Promise.all([
      this.tenantRepo.find({ order: { createdAt: 'DESC' } }),
      this.userRepo.find({ where: userWhere, order: { createdAt: 'DESC' } }),
      this.dataSource.query(studentQuery, studentParams),
      this.enrollmentRepo.count({ where: enrollmentWhere }),
    ]);

    const totalInstitutes = tenants.length;
    const approvedInstitutes = tenants.filter((tenant) => tenant.status === TenantStatus.ACTIVE).length;
    const pendingApprovals = tenants.filter((tenant) => tenant.status === TenantStatus.TRIAL).length;
    const activeUsers = users.filter((user) => user.status === UserStatus.ACTIVE).length;
    const totalStudents = Number(students?.[0]?.count || 0);
    const totalTeachers = users.filter((user) => user.role === UserRole.TEACHER).length;
    const monthlyRevenue = tenantId ? await this.calculateMonthlyRevenue(tenantId) : await this.calculateMonthlyRevenue();
    const instituteTrend = this.buildMonthlyTrend(tenants);
    const statusBreakdown = [
      { name: 'ACTIVE', value: approvedInstitutes, color: '#16A34A' },
      { name: 'PENDING', value: pendingApprovals, color: '#0EA5E9' },
      { name: 'SUSPENDED', value: tenants.filter((tenant) => tenant.status === TenantStatus.SUSPENDED).length, color: '#DC2626' },
    ];

    return {
      totalInstitutes,
      approvedInstitutes,
      pendingApprovals,
      activeUsers,
      totalStudents,
      totalTeachers,
      studentAttendancePercentage: 85, // Placeholder since there is no attendance table
      teacherAttendancePercentage: 92, // Placeholder since there is no attendance table
      monthlyRevenue,
      instituteTrend,
      statusBreakdown,
      openComplaints: await this.complaintRepo.count({ where: tenantId ? { tenantId, status: ComplaintStatus.OPEN } : { status: ComplaintStatus.OPEN } }),
      inProgressComplaints: await this.complaintRepo.count({ where: tenantId ? { tenantId, status: ComplaintStatus.IN_PROGRESS } : { status: ComplaintStatus.IN_PROGRESS } }),
      resolvedComplaints: await this.complaintRepo.count({ where: tenantId ? { tenantId, status: ComplaintStatus.RESOLVED } : { status: ComplaintStatus.RESOLVED } }),
      closedComplaints: await this.complaintRepo.count({ where: tenantId ? { tenantId, status: ComplaintStatus.CLOSED } : { status: ComplaintStatus.CLOSED } }),
      recentInstitutes: tenants.slice(0, 5).map((tenant) => this.toInstituteSummary(tenant)),
      recentTickets: (await this.complaintRepo.find({ where: tenantId ? { tenantId } : {}, relations: ['tenant'], order: { createdAt: 'DESC' }, take: 5 })).map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        status: c.status,
        institute: c.tenant ? { id: c.tenant.id, name: c.tenant.name } : null,
        tenantId: c.tenantId,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
      topInstitutes: tenants.slice(0, 5).map((tenant) => this.toInstituteSummary(tenant)),
      recentActivity: this.buildRecentActivity(tenants, users),
      revenueTrend: this.buildRevenueTrend(tenants),
      aiUsageTrend: [],
      enrollments,
    };
  }

  async getAnnouncements(query: Record<string, any>) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
    const skip = (page - 1) * limit;

    const [announcements, total] = await this.announcementRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      announcements: announcements.map((announcement) => this.toNoticeView(announcement)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 0 },
    };
  }

  async getStudents(query: Record<string, any>) {
    const tenantId = typeof query.tenantId === 'string' && query.tenantId.trim() ? query.tenantId.trim() : undefined;
    const search = typeof query.search === 'string' ? query.search.trim().toLowerCase() : '';

    const students = await this.studentRepo.find({
      where: tenantId ? { tenantId } : {},
      relations: ['user', 'tenant'],
      order: { createdAt: 'DESC' },
    });

    const items = students
      .map((student) => this.toStudentView(student))
      .filter((student) => !search || [student.name, student.email, student.studentProfile?.enrollmentNo, student.studentProfile?.section?.class?.name, student.studentProfile?.section?.name]
        .some((value) => String(value || '').toLowerCase().includes(search)));

    return items;
  }

  async createStudent(payload: Record<string, any>, currentUser: any) {
    const tenantId = currentUser?.tenantId || payload.tenantId;
    const phoneNumber = this.normalizePhoneNumber(payload.phone || payload.phoneNumber || payload.mobile || null);
    const email = String(payload.email || '').trim().toLowerCase();
    const fullName = String(payload.name || payload.fullName || '').trim();

    if (!tenantId) throw new NotFoundException('tenantId is required');
    if (!fullName) throw new NotFoundException('Student name is required');
    if (!email) throw new NotFoundException('Student email is required');

    const existingEmail = await this.userRepo.findOne({ where: { email, tenantId } });
    if (existingEmail) throw new ConflictException('A user with this email already exists in this tenant');

    const existingPhone = await this.userRepo.findOne({ where: { phoneNumber, tenantId } });
    if (existingPhone) throw new ConflictException('A user with this phone number already exists in this tenant');

    const user = await this.userRepo.save(this.userRepo.create({
      tenantId,
      phoneNumber,
      email,
      fullName,
      password: payload.password || this.generateTempPassword(),
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      phoneVerified: true,
      emailVerified: true,
      isFirstLogin: false,
    }));

    const student = await this.studentRepo.save(this.studentRepo.create({
      tenantId,
      userId: user.id,
      examTarget: payload.examTarget || payload.course || null,
      class: payload.className || payload.class || null,
      examYear: payload.examYear || null,
      targetCollege: payload.targetCollege || null,
      dailyStudyHours: Number(payload.dailyStudyHours || 4),
      careOf: payload.fatherName || payload.careOf || null,
      alternatePhoneNumber: payload.parentPhone || payload.alternatePhoneNumber || null,
      address: payload.address || payload.currentAddress || null,
      city: payload.city || null,
      state: payload.state || null,
      pinCode: payload.pinCode || null,
      coachingName: payload.coachingName || null,
      subscriptionPlan: payload.subscriptionPlan || 'free',
      onboardingComplete: true,
    }));

    return this.toStudentView({ ...student, user });
  }

  async updateStudent(id: string, payload: Record<string, any>, currentUser: any) {
    const tenantId = currentUser?.tenantId || payload.tenantId;
    const student = await this.studentRepo.findOne({ where: tenantId ? { id, tenantId } : { id }, relations: ['user', 'tenant'] });
    if (!student) throw new NotFoundException(`Student ${id} not found`);

    const nextEmail = payload.email ? String(payload.email).trim().toLowerCase() : student.user?.email;
    const nextPhone = payload.phone || payload.phoneNumber || student.user?.phoneNumber;
    const nextName = payload.name || payload.fullName || student.user?.fullName;

    if (nextEmail && nextEmail !== student.user?.email) {
      const duplicate = await this.userRepo.findOne({ where: { tenantId: student.tenantId, email: nextEmail } });
      if (duplicate) throw new ConflictException('A user with this email already exists in this tenant');
    }

    if (nextPhone && nextPhone !== student.user?.phoneNumber) {
      const normalizedPhone = this.normalizePhoneNumber(nextPhone);
      const duplicate = await this.userRepo.findOne({ where: { tenantId: student.tenantId, phoneNumber: normalizedPhone } });
      if (duplicate) throw new ConflictException('A user with this phone number already exists in this tenant');
      student.user.phoneNumber = normalizedPhone;
    }

    student.user.fullName = nextName || student.user.fullName;
    student.user.email = nextEmail || student.user.email;
    await this.userRepo.save(student.user);

    student.examTarget = payload.examTarget ?? student.examTarget;
    student.class = payload.className ?? payload.class ?? student.class;
    student.targetCollege = payload.targetCollege ?? student.targetCollege;
    student.address = payload.address ?? payload.currentAddress ?? student.address;
    student.city = payload.city ?? student.city;
    student.state = payload.state ?? student.state;
    student.pinCode = payload.pinCode ?? student.pinCode;
    student.coachingName = payload.coachingName ?? student.coachingName;
    await this.studentRepo.save(student);

    return this.toStudentView(student);
  }

  async deleteStudent(id: string) {
    const student = await this.studentRepo.findOne({ where: { id }, relations: ['user'] });
    if (!student) throw new NotFoundException(`Student ${id} not found`);
    await this.studentRepo.softDelete(id);
    await this.userRepo.softDelete(student.userId);
    return { success: true };
  }

  async getTeachers(query: Record<string, any>) {
    const tenantId = typeof query.tenantId === 'string' && query.tenantId.trim() ? query.tenantId.trim() : undefined;
    const search = typeof query.search === 'string' ? query.search.trim().toLowerCase() : '';

    const profiles = await this.teacherProfileRepo.find({
      where: tenantId ? { tenantId } : {},
      relations: ['user', 'user.tenant'],
      order: { createdAt: 'DESC' },
    });

    const items = profiles
      .map((profile) => this.toTeacherView(profile))
      .filter((teacher) => !search || [teacher.name, teacher.email, teacher.teacherProfile?.department, teacher.teacherProfile?.qualification]
        .some((value) => String(value || '').toLowerCase().includes(search)));

    return items;
  }

  async createTeacher(payload: Record<string, any>, currentUser: any) {
    const tenantId = currentUser?.tenantId || payload.tenantId;
    const phoneNumber = this.normalizePhoneNumber(payload.phone || payload.phoneNumber || payload.mobile || null);
    const email = String(payload.email || '').trim().toLowerCase();
    const fullName = String(payload.name || payload.fullName || '').trim();

    if (!tenantId) throw new NotFoundException('tenantId is required');
    if (!fullName) throw new NotFoundException('Teacher name is required');
    if (!email) throw new NotFoundException('Teacher email is required');

    const existingEmail = await this.userRepo.findOne({ where: { email, tenantId } });
    if (existingEmail) throw new ConflictException('A user with this email already exists in this tenant');

    const existingPhone = await this.userRepo.findOne({ where: { phoneNumber, tenantId } });
    if (existingPhone) throw new ConflictException('A user with this phone number already exists in this tenant');

    const tempPassword = payload.password || this.generateTempPassword();
    const user = await this.userRepo.save(this.userRepo.create({
      tenantId,
      phoneNumber,
      email,
      fullName,
      password: tempPassword,
      role: UserRole.TEACHER,
      status: UserStatus.ACTIVE,
      phoneVerified: true,
      emailVerified: true,
      isFirstLogin: false,
    }));

    const profile = await this.teacherProfileRepo.save(this.teacherProfileRepo.create({
      tenantId,
      userId: user.id,
      qualification: payload.qualification || payload.qualifications || payload.department || null,
      subjectExpertise: Array.isArray(payload.subjectIds) ? payload.subjectIds : [],
      classesTeach: Array.isArray(payload.classIds) ? payload.classIds : [],
      yearsOfExperience: payload.yearsOfExperience ? Number(payload.yearsOfExperience) : null,
      bio: payload.bio || null,
      gender: payload.gender || null,
      city: payload.city || null,
      state: payload.state || null,
      previousInstitute: payload.previousInstitute || null,
      teachingMode: payload.teachingMode || null,
      onboardingComplete: true,
    }));

    return this.toTeacherView({ ...profile, user });
  }

  async updateTeacher(id: string, payload: Record<string, any>, currentUser: any) {
    const tenantId = currentUser?.tenantId || payload.tenantId;
    const profile = await this.teacherProfileRepo.findOne({ where: tenantId ? { id, tenantId } : { id }, relations: ['user', 'user.tenant'] });
    if (!profile) throw new NotFoundException(`Teacher ${id} not found`);

    profile.user.fullName = payload.name || payload.fullName || profile.user.fullName;
    profile.user.email = payload.email ? String(payload.email).trim().toLowerCase() : profile.user.email;
    if (payload.phone || payload.phoneNumber) profile.user.phoneNumber = this.normalizePhoneNumber(payload.phone || payload.phoneNumber);
    await this.userRepo.save(profile.user);

    profile.qualification = payload.qualification || payload.qualifications || payload.department || profile.qualification;
    profile.subjectExpertise = Array.isArray(payload.subjectIds) ? payload.subjectIds : profile.subjectExpertise;
    profile.classesTeach = Array.isArray(payload.classIds) ? payload.classIds : profile.classesTeach;
    profile.yearsOfExperience = payload.yearsOfExperience ? Number(payload.yearsOfExperience) : profile.yearsOfExperience;
    profile.bio = payload.bio ?? profile.bio;
    profile.gender = payload.gender ?? profile.gender;
    profile.city = payload.city ?? profile.city;
    profile.state = payload.state ?? profile.state;
    profile.previousInstitute = payload.previousInstitute ?? profile.previousInstitute;
    profile.teachingMode = payload.teachingMode ?? profile.teachingMode;
    await this.teacherProfileRepo.save(profile);

    return this.toTeacherView(profile);
  }

  async deleteTeacher(id: string) {
    const profile = await this.teacherProfileRepo.findOne({ where: { id }, relations: ['user'] });
    if (!profile) throw new NotFoundException(`Teacher ${id} not found`);
    await this.teacherProfileRepo.softDelete(id);
    await this.userRepo.softDelete(profile.userId);
    return { success: true };
  }

  async getEvents(query: Record<string, any>, currentUser: any) {
    const tenantId = currentUser?.tenantId || query.tenantId || null;
    const category = typeof query.category === 'string' ? query.category : 'All';
    const from = query.from ? new Date(query.from) : null;
    const to = query.to ? new Date(query.to) : null;

    const items = this.events
      .filter((event) => !tenantId || event.tenantId === tenantId)
      .filter((event) => category === 'All' || event.category === category)
      .filter((event) => !from || new Date(event.startTime) >= from)
      .filter((event) => !to || new Date(event.startTime) <= to)
      .sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));

    return items;
  }

  async createEvent(payload: Record<string, any>, currentUser: any) {
    const tenantId = currentUser?.tenantId || payload.tenantId || null;
    const event = {
      id: `event_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      tenantId,
      title: payload.title || 'Event',
      startTime: payload.startTime || payload.start || new Date().toISOString(),
      endTime: payload.endTime || payload.end || payload.startTime || new Date().toISOString(),
      category: payload.category || 'ACADEMIC',
      description: payload.description || '',
      location: payload.location || '',
      priority: payload.priority || 'NORMAL',
      createdAt: new Date().toISOString(),
    };
    this.events.unshift(event);
    return event;
  }

  async deleteEvent(id: string) {
    const index = this.events.findIndex((event) => event.id === id);
    if (index === -1) throw new NotFoundException(`Event ${id} not found`);
    this.events.splice(index, 1);
    return { success: true };
  }

  async createNotice(payload: Record<string, any>) {
    const notice = await this.announcementRepo.save(
      this.announcementRepo.create({
        title: payload.title,
        body: payload.content || payload.body || '',
        targetRole: this.normalizeTargetRole(payload.targetRoles),
      }),
    );

    this.noticeExtras.set(notice.id, this.extractNoticeExtras(payload));
    return this.toNoticeView(notice, payload);
  }

  async updateNotice(id: string, payload: Record<string, any>) {
    const notice = await this.announcementRepo.findOne({ where: { id } });
    if (!notice) throw new NotFoundException(`Announcement ${id} not found`);

    notice.title = payload.title ?? notice.title;
    notice.body = payload.content ?? payload.body ?? notice.body;
    notice.targetRole = this.normalizeTargetRole(payload.targetRoles) || notice.targetRole;
    await this.announcementRepo.save(notice);
    this.noticeExtras.set(id, { ...this.noticeExtras.get(id), ...this.extractNoticeExtras(payload) });
    return this.toNoticeView(notice, payload);
  }

  async deleteNotice(id: string) {
    const notice = await this.announcementRepo.findOne({ where: { id } });
    if (!notice) throw new NotFoundException(`Announcement ${id} not found`);
    await this.announcementRepo.softDelete(id);
    this.noticeExtras.delete(id);
    return { message: 'Announcement deleted successfully' };
  }

  async getFees(query: Record<string, any>) {
    const rows = await this.queryFeeRows(query);
    return rows.map((row) => this.toFeeView(row));
  }

  async getFeeAnalytics(query: Record<string, any>) {
    const rows = await this.queryFeeRows(query);
    const summary = rows.reduce(
      (acc, fee) => {
        acc.totalRevenue += fee.amount;
        acc.totalCollected += fee.paidAmount;
        acc.totalPending += fee.remainingBalance;
        if (fee.status === 'OVERDUE') acc.overdueCount += 1;
        return acc;
      },
      { totalRevenue: 0, totalCollected: 0, totalPending: 0, overdueCount: 0 },
    );

    return {
      summary,
      statusBreakdown: this.buildFeeStatusBreakdown(rows),
      revenueTrend: this.buildFeeRevenueTrend(rows),
    };
  }

  async recordFeePayment(payload: Record<string, any>) {
    const feeId = payload.feeId || payload.enrollmentId;
    if (!feeId) {
      throw new NotFoundException('feeId is required');
    }

    const enrollment = await this.enrollmentRepo.findOne({
      where: { id: feeId },
      relations: ['student', 'student.user', 'batch', 'tenant'],
    });

    if (!enrollment) {
      throw new NotFoundException(`Fee record ${feeId} not found`);
    }

    const feeAmount = Number(enrollment.batch?.feeAmount || 0);
    const previousPaid = Number(enrollment.feePaid || 0);
    const increment = Number(payload.amount || 0);
    const paidAmount = Math.min(feeAmount || previousPaid + increment, previousPaid + increment);

    enrollment.feePaid = paidAmount;
    enrollment.feePaidAt = new Date();
    await this.enrollmentRepo.save(enrollment);

    const receiptNo = `RCPT-${Date.now().toString().slice(-8)}`;
    return {
      receipt: {
        receiptNo,
        amount: paidAmount - previousPaid,
        paymentDate: enrollment.feePaidAt,
      },
      fee: this.toFeeView(await this.fetchFeeRow(enrollment.id)),
    };
  }

  async getChatUsers(role: string, query: Record<string, any>, currentUser?: any) {
    const users = await this.getRoleUsers(role, query.q, currentUser?.tenantId || query.tenantId);
    return users.map((user) => this.toChatPeer(user));
  }

  async getChatConversations(role: string, currentUser?: any) {
    const peers = await this.getRoleUsers(role, '', currentUser?.tenantId);
    return peers.map((peer) => this.toConversation(peer, currentUser?.id));
  }

  async getChatMessages(peerId: string, currentUser: any) {
    const currentUserId = currentUser?.id;
    if (!currentUserId) {
      throw new UnauthorizedException('User not authenticated');
    }
    const conversation = this.chatMessages.filter(
      (message) =>
        (message.sender_id === currentUserId && message.receiver_id === peerId) ||
        (message.sender_id === peerId && message.receiver_id === currentUserId),
    );

    return conversation.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async sendChatMessage(payload: Record<string, any>, currentUser: any) {
    const currentUserId = currentUser?.id;
    if (!currentUserId) {
      throw new UnauthorizedException('User not authenticated');
    }
    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      sender_id: currentUserId,
      receiver_id: String(payload.receiverId || payload.receiver_id || ''),
      content: String(payload.content || ''),
      createdAt: new Date().toISOString(),
      readAt: null,
    };

    this.chatMessages.push(message);
    return message;
  }

  async markChatAsRead(peerId: string, currentUser: any) {
    const currentUserId = currentUser?.id;
    if (!currentUserId) {
      throw new UnauthorizedException('User not authenticated');
    }
    const now = new Date().toISOString();
    this.chatMessages.forEach((message) => {
      if (message.sender_id === peerId && message.receiver_id === currentUserId) {
        message.readAt = now;
      }
    });
    return { ok: true };
  }

  async getComplaints(currentUser: any) {
    if (currentUser?.role === UserRole.SUPER_ADMIN) {
      const allComplaints = await this.complaintRepo.find({ relations: ['tenant', 'user'], order: { createdAt: 'DESC' } });
      return allComplaints.map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        status: c.status,
        institute: c.tenant ? { id: c.tenant.id, name: c.tenant.name } : null,
        tenantId: c.tenantId,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      }));
    }

    const tenantId = currentUser?.tenantId;
    const items = await this.complaintRepo.find({ where: tenantId ? { tenantId } : {}, relations: ['tenant', 'user'], order: { createdAt: 'DESC' } });
    
    return items.map(c => ({
      id: c.id,
      title: c.title,
      description: c.description,
      status: c.status,
      institute: c.tenant ? { id: c.tenant.id, name: c.tenant.name } : null,
      tenantId: c.tenantId,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
  }

  async createComplaint(payload: Record<string, any>, currentUser: any) {
    const tenantId = payload.tenantId || currentUser?.tenantId || null;
    const complaint = this.complaintRepo.create({
      title: payload.title || 'Support ticket',
      description: payload.description || '',
      status: ComplaintStatus.OPEN,
      tenantId: tenantId,
      userId: currentUser?.id,
    });

    const saved = await this.complaintRepo.save(complaint);
    const tenant = tenantId ? await this.tenantRepo.findOne({ where: { id: tenantId } }) : null;

    return {
      id: saved.id,
      title: saved.title,
      description: saved.description,
      status: saved.status,
      institute: tenant ? { id: tenant.id, name: tenant.name } : null,
      tenantId: saved.tenantId,
      createdAt: saved.createdAt.toISOString(),
      updatedAt: saved.updatedAt.toISOString(),
    };
  }

  async updateComplaint(id: string, payload: Record<string, any>) {
    const complaint = await this.complaintRepo.findOne({ where: { id }, relations: ['tenant'] });
    if (!complaint) {
      throw new NotFoundException(`Complaint ${id} not found`);
    }

    const nextStatus = payload.status as ComplaintStatus;
    if (Object.values(ComplaintStatus).includes(nextStatus)) {
      complaint.status = nextStatus;
    }
    const saved = await this.complaintRepo.save(complaint);

    return {
      id: saved.id,
      title: saved.title,
      description: saved.description,
      status: saved.status,
      institute: saved.tenant ? { id: saved.tenant.id, name: saved.tenant.name } : null,
      tenantId: saved.tenantId,
      createdAt: saved.createdAt.toISOString(),
      updatedAt: saved.updatedAt.toISOString(),
    };
  }

  async getRoles() {
    const counts = await this.getRoleCounts();
    return [
      { id: 'super_admin', name: 'Super Admin', description: 'Platform owner with full access', userCount: counts.super_admin, permissions: ['*'], status: 'ACTIVE' },
      { id: 'institute_admin', name: 'Institute Admin', description: 'Manages institute operations', userCount: counts.institute_admin, permissions: ['institutes', 'fees', 'notices', 'communications'], status: 'ACTIVE' },
      { id: 'teacher', name: 'Teacher', description: 'Teaching and class management', userCount: counts.teacher, permissions: ['classes', 'chat', 'analytics'], status: 'ACTIVE' },
      { id: 'student', name: 'Student', description: 'Learner access', userCount: counts.student, permissions: ['learn', 'doubts', 'tests'], status: 'ACTIVE' },
      { id: 'parent', name: 'Parent', description: 'Parent access', userCount: counts.parent, permissions: ['progress', 'notices'], status: 'ACTIVE' },
    ];
  }

  async getAuditLogs() {
    const [users, tenants, notices] = await Promise.all([
      this.userRepo.find({ order: { lastLoginAt: 'DESC' }, take: 10, relations: ['tenant'] }),
      this.tenantRepo.find({ order: { updatedAt: 'DESC' }, take: 5 }),
      this.announcementRepo.find({ order: { createdAt: 'DESC' }, take: 5 }),
    ]);

    const logs = [
      ...users.map((user) => ({
        id: `log_user_${user.id}`,
        createdAt: user.lastLoginAt || user.updatedAt,
        userName: user.fullName,
        role: user.role,
        module: 'auth',
        action: 'LOGIN',
        ipAddress: '127.0.0.1',
        status: user.status === UserStatus.ACTIVE ? 'OK' : 'WARN',
      })),
      ...tenants.map((tenant) => ({
        id: `log_tenant_${tenant.id}`,
        createdAt: tenant.updatedAt,
        userName: tenant.name,
        role: 'system',
        module: 'institutes',
        action: 'UPDATE',
        ipAddress: '127.0.0.1',
        status: 'OK',
      })),
      ...notices.map((notice) => ({
        id: `log_notice_${notice.id}`,
        createdAt: notice.createdAt,
        userName: 'System',
        role: 'system',
        module: 'notices',
        action: 'PUBLISH',
        ipAddress: '127.0.0.1',
        status: 'OK',
      })),
    ];

    return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getSecurityScore() {
    const [users, tenants] = await Promise.all([this.userRepo.find(), this.tenantRepo.find()]);
    const activeUsers = users.filter((user) => user.status === UserStatus.ACTIVE).length;
    const verifiedUsers = users.filter((user) => user.emailVerified || user.phoneVerified).length;
    const activeTenants = tenants.filter((tenant) => tenant.status === TenantStatus.ACTIVE).length;
    const baseScore = 55;
    const score = Math.min(100, Math.round(baseScore + (activeUsers / Math.max(1, users.length)) * 15 + (verifiedUsers / Math.max(1, users.length)) * 15 + (activeTenants / Math.max(1, tenants.length)) * 15));

    return {
      score,
      activeUsers,
      verifiedUsers,
      activeTenants,
      recommendations: [
        'Enable stronger password policies for administrators.',
        'Review inactive sessions and verify alert routing.',
      ],
    };
  }

  async getSecuritySessions() {
    const users = await this.userRepo.find({ order: { lastLoginAt: 'DESC' }, take: 20, relations: ['tenant'] });
    return users
      .filter((user) => user.lastLoginAt)
      .map((user) => ({
        id: user.id,
        userId: user.id,
        userName: user.fullName,
        role: user.role,
        device: 'Web',
        browser: 'Chrome',
        location: user.tenant?.city || user.tenant?.state || 'Unknown',
        loginTime: user.lastLoginAt,
        status: user.status,
      }));
  }

  // --- ACADEMIC CLASSES & SECTIONS ---
  async getAcademicClasses(currentUser?: any) {
    return this.academicClasses.filter((c) => c.tenantId === currentUser?.tenantId);
  }

  async getAcademicSubjects(currentUser?: any) {
    // Return empty array for now to prevent 404
    return [];
  }

  async getTimetable(currentUser?: any) {
    // Return empty array for now to prevent 404
    return [];
  }

  async createAcademicClass(payload: Record<string, any>, user: any) {
    const newClass = {
      id: `class_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: payload.name,
      level: payload.level,
      building: payload.building,
      tenantId: user?.tenantId,
      sections: [],
      subjectIds: Array.isArray(payload.subjectIds) ? payload.subjectIds : [],
      subjectNames: Array.isArray(payload.subjectNames) ? payload.subjectNames : [],
    };
    
    if (payload.section) {
      const sectionNames = payload.section.split(',').map((s: string) => s.trim()).filter(Boolean);
      sectionNames.forEach((sName: string) => {
        newClass.sections.push({
          id: `sec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          name: sName,
          classId: newClass.id,
          classTeacherId: payload.classTeacherId || null,
          subjectIds: Array.isArray(payload.subjectIds) ? payload.subjectIds : [],
        });
      });
    }

    this.academicClasses.push(newClass);
    return newClass;
  }

  async updateAcademicClass(id: string, payload: Record<string, any>) {
    const classIdx = this.academicClasses.findIndex(c => c.id === id);
    if (classIdx === -1) throw new NotFoundException(`Class ${id} not found`);
    
    this.academicClasses[classIdx] = {
      ...this.academicClasses[classIdx],
      name: payload.name ?? this.academicClasses[classIdx].name,
      level: payload.level ?? this.academicClasses[classIdx].level,
      building: payload.building ?? this.academicClasses[classIdx].building,
      subjectIds: Array.isArray(payload.subjectIds) ? payload.subjectIds : this.academicClasses[classIdx].subjectIds || [],
      subjectNames: Array.isArray(payload.subjectNames) ? payload.subjectNames : this.academicClasses[classIdx].subjectNames || [],
    };
    return this.academicClasses[classIdx];
  }

  async deleteAcademicClass(id: string) {
    const classIdx = this.academicClasses.findIndex(c => c.id === id);
    if (classIdx === -1) throw new NotFoundException(`Class ${id} not found`);
    this.academicClasses.splice(classIdx, 1);
    return { success: true };
  }

  async createAcademicSection(classId: string, payload: Record<string, any>) {
    const classObj = this.academicClasses.find(c => c.id === classId);
    if (!classObj) throw new NotFoundException(`Class ${classId} not found`);
    
    const newSection = {
      id: `sec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: payload.name,
      classId,
      classTeacherId: payload.classTeacherId || null,
      subjectIds: Array.isArray(payload.subjectIds) ? payload.subjectIds : [],
    };
    classObj.sections.push(newSection);
    return newSection;
  }

  async updateAcademicSection(id: string, payload: Record<string, any>) {
    for (const c of this.academicClasses) {
      const section = c.sections.find((s: any) => s.id === id);
      if (section) {
        section.name = payload.name ?? section.name;
        section.classTeacherId = payload.classTeacherId ?? section.classTeacherId;
        if (Array.isArray(payload.subjectIds)) section.subjectIds = payload.subjectIds;
        return section;
      }
    }
    throw new NotFoundException(`Section ${id} not found`);
  }

  async deleteAcademicSection(id: string) {
    for (const c of this.academicClasses) {
      const sectionIdx = c.sections.findIndex((s: any) => s.id === id);
      if (sectionIdx !== -1) {
        c.sections.splice(sectionIdx, 1);
        return { success: true };
      }
    }
    throw new NotFoundException(`Section ${id} not found`);
  }

  async assignAcademicSectionSubjects(id: string, payload: Record<string, any>) {
    for (const c of this.academicClasses) {
      const section = c.sections.find((s: any) => s.id === id);
      if (section) {
        section.subjectIds = Array.isArray(payload.subjectIds) ? payload.subjectIds : [];
        section.subjectNames = Array.isArray(payload.subjectNames) ? payload.subjectNames : [];
        return section;
      }
    }
    throw new NotFoundException(`Section ${id} not found`);
  }

  async assignAcademicClassSubjects(id: string, payload: Record<string, any>) {
    const classIdx = this.academicClasses.findIndex((c) => c.id === id);
    if (classIdx === -1) throw new NotFoundException(`Class ${id} not found`);
    this.academicClasses[classIdx].subjectIds = Array.isArray(payload.subjectIds) ? payload.subjectIds : [];
    this.academicClasses[classIdx].subjectNames = Array.isArray(payload.subjectNames) ? payload.subjectNames : [];
    return this.academicClasses[classIdx];
  }

  // --- CLASSES SCHEDULES & RECORDINGS ---
  async getSchedules(user: any) {
    const tenantId = user?.tenantId;
    const items = tenantId ? this.schedules.filter(s => s.tenantId === tenantId) : this.schedules;
    return { data: items };
  }

  async createSchedule(payload: Record<string, any>, user: any) {
    const newSchedule = {
      id: `sched_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      tenantId: user?.tenantId,
      subject_name: payload.subject_id || 'Subject',
      class_name: payload.class_id || 'Class',
      day_of_week: payload.day_of_week,
      start_time: payload.start_time,
      end_time: payload.end_time,
      type: payload.type,
      zoom_link: payload.zoom_link,
      google_meet_link: payload.google_meet_link,
      live_status: payload.live_status || 'scheduled',
      created_at: new Date().toISOString(),
    };
    this.schedules.push(newSchedule);
    return { data: newSchedule };
  }

  async getRecordings(user: any) {
    const tenantId = user?.tenantId;
    const items = tenantId ? this.recordings.filter(r => r.tenantId === tenantId) : this.recordings;
    return { data: items };
  }

  // --- TOPICS & MATERIALS ---
  async getTopics(user: any) {
    const tenantId = user?.tenantId;
    const items = tenantId ? this.topics.filter(t => t.tenantId === tenantId) : this.topics;
    return { data: items };
  }

  async createTopic(payload: Record<string, any>, user: any) {
    const newTopic = {
      id: `topic_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      tenantId: user?.tenantId,
      name: payload.name,
      subject_id: payload.subject_id,
      subject_name: payload.subject_name || 'Subject',
      status: 'active',
      progress: 0,
      chapters: [],
    };
    this.topics.push(newTopic);
    return { data: newTopic };
  }

  async getTopicById(id: string) {
    const topic = this.topics.find(t => t.id === id);
    if (!topic) throw new NotFoundException(`Topic ${id} not found`);
    return { data: topic };
  }

  async createTopicChapter(id: string, payload: Record<string, any>) {
    const topic = this.topics.find(t => t.id === id);
    if (!topic) throw new NotFoundException(`Topic ${id} not found`);
    
    const newChapter = {
      id: `chap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: payload.name,
      order: payload.order,
      status: 'active',
      progress: 0,
    };
    topic.chapters.push(newChapter);
    return { data: newChapter };
  }

  async uploadMaterial(payload: Record<string, any>) {
    const newMaterial = {
      id: `mat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: payload.title,
      chapter_id: payload.chapter_id,
      uploadedAt: new Date().toISOString(),
    };
    this.materials.push(newMaterial);
    return { data: newMaterial, message: 'Material uploaded successfully' };
  }

  // --- ASSESSMENTS ANALYTICS & LEADERBOARD ---
  async getAssessmentLeaderboard(id: string) {
    // Generate dummy leaderboard data to prevent UI from breaking
    const data = [
      { student_name: "Alice Johnson", class_name: "12-A", marks_obtained: 95, percentage: 95 },
      { student_name: "Bob Smith", class_name: "12-A", marks_obtained: 88, percentage: 88 },
      { student_name: "Charlie Brown", class_name: "12-A", marks_obtained: 82, percentage: 82 },
      { student_name: "Diana Prince", class_name: "12-A", marks_obtained: 78, percentage: 78 },
      { student_name: "Evan Wright", class_name: "12-A", marks_obtained: 65, percentage: 65 },
    ];
    return { data };
  }

  async getAssessmentAnalytics(id: string) {
    // Generate dummy analytics data
    const data = {
      averageScore: 81,
      highestScore: 95,
      passRate: 90,
      distinctionRate: 40,
      gradeDistribution: [
        { grade: "A", count: 12, color: "#4ade80" },
        { grade: "B", count: 18, color: "#3b82f6" },
        { grade: "C", count: 10, color: "#f59e0b" },
        { grade: "D", count: 4, color: "#ef4444" },
        { grade: "F", count: 2, color: "#94a3b8" },
      ],
    };
    return { data };
  }

  // --- ASSIGNMENTS ---
  async getAssignments(user: any) {
    const tenantId = user?.tenantId;
    const items = tenantId ? this.assignments.filter(a => a.tenantId === tenantId) : this.assignments;
    return { data: items };
  }

  async createAssignment(payload: Record<string, any>, user: any) {
    const newAssignment = {
      id: `assn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      tenantId: user?.tenantId,
      title: payload.title,
      type: payload.type,
      class_id: payload.class_id,
      class_name: 'Class ' + payload.class_id,
      subject_id: payload.subject_id,
      subject_name: 'Subject ' + payload.subject_id,
      due_date: payload.due_date,
      instructions: payload.instructions,
      status: 'active',
    };
    this.assignments.push(newAssignment);
    return { data: newAssignment };
  }

  async deleteAssignment(id: string) {
    const idx = this.assignments.findIndex(a => a.id === id);
    if (idx !== -1) {
      this.assignments.splice(idx, 1);
      return { success: true };
    }
    throw new NotFoundException(`Assignment ${id} not found`);
  }

  // --- ATTENDANCE ---
  async getAttendanceReport(user: any) {
    const students = await this.getStudents({ tenantId: user?.tenantId });
    const lookup = new Map(students.map((student: any) => [student.id, student]));

    return this.attendanceRecords.map((record, index) => {
      const matchedStudent = lookup.get(record.studentId) || students[index % Math.max(1, students.length)];
      return this.toAttendanceView(record, matchedStudent);
    });
  }

  async getAttendanceStudents(classId: string, user: any) {
    const students = await this.getStudents({ tenantId: user?.tenantId });
    return students.filter((student: any) => !classId || student.studentProfile?.section?.class?.id === classId);
  }

  async markAttendance(payload: Record<string, any>, user: any) {
    const entry = {
      studentId: body.studentId || body.userId,
      name: body.name || body.studentName || 'Student',
      className: body.className || body.class || 'Class',
      present: body.status === 'PRESENT' ? 1 : 0,
      absent: body.status === 'ABSENT' ? 1 : 0,
      late: body.status === 'LATE' ? 1 : 0,
      percentage: body.status === 'PRESENT' ? 100 : 0,
      date: body.date || new Date().toISOString().split('T')[0],
      status: body.status || 'PRESENT',
      remarks: body.remarks || '',
    };
    this.attendanceRecords.unshift(entry);
    return { success: true, marked: entry };
    // Just mock success
    return { success: true, message: 'Attendance marked successfully' };
  }

  // --- GRIEVANCES ---
  async getGrievances(user: any) {
    const tenantId = user?.tenantId;
    const items = tenantId ? this.grievances.filter(g => g.tenantId === tenantId) : this.grievances;
    return { data: items };
  }

  async createGrievance(payload: Record<string, any>, user: any) {
    const newGrievance = {
      id: `grv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      tenantId: user?.tenantId,
      title: payload.title,
      category: payload.category,
      priority: payload.priority,
      description: payload.description,
      status: 'open',
      raised_by_name: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Anonymous',
      created_at: new Date().toISOString()
    };
    this.grievances.push(newGrievance);
    return { data: newGrievance };
  }

  private async getRoleUsers(role: string, search = '', tenantId?: string) {
    const normalizedRole = this.normalizeUserRole(role);
    const qb = this.userRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.tenant', 'tenant')
      .where('u.deletedAt IS NULL');

    if (normalizedRole) {
      qb.andWhere('u.role = :role', { role: normalizedRole });
    }
    if (tenantId) {
      qb.andWhere('u.tenantId = :tenantId', { tenantId });
    }
    if (search) {
      qb.andWhere('(u.fullName ILIKE :search OR u.email ILIKE :search)', { search: `%${search}%` });
    }

    const users = await qb.orderBy('u.fullName', 'ASC').take(50).getMany();
    return users;
  }

  private normalizePhoneNumber(raw?: string | null) {
    const value = String(raw || '').trim();
    if (!value) {
      return `+91${String(Date.now()).slice(-10)}`;
    }
    if (value.startsWith('+')) return value;
    const digits = value.replace(/\D/g, '');
    if (digits.length === 10) return `+91${digits}`;
    return `+${digits || String(Date.now()).slice(-10)}`;
  }

  private generateTempPassword() {
    return `Temp@${Math.random().toString(36).slice(2, 8)}${String(Date.now()).slice(-4)}`;
  }

  private toStudentView(student: Student & { user?: User }) {
    const className = String(student.class || student.examTarget || 'Unassigned');
    return {
      id: student.user?.id || student.userId,
      name: student.user?.fullName || 'Student',
      email: student.user?.email || '',
      phone: student.user?.phoneNumber || null,
      role: 'STUDENT',
      isActive: student.user?.status === UserStatus.ACTIVE,
      createdAt: student.createdAt,
      studentProfile: {
        id: student.id,
        enrollmentNo: student.id.slice(0, 8).toUpperCase(),
        sectionId: student.id,
        section: {
          id: student.id,
          name: 'A',
          classId: student.tenantId,
          class: { id: student.tenantId, name: className },
        },
      },
    };
  }

  private toTeacherView(profile: TeacherProfile & { user?: User }) {
    return {
      id: profile.user?.id || profile.userId,
      name: profile.user?.fullName || 'Teacher',
      email: profile.user?.email || '',
      phone: profile.user?.phoneNumber || null,
      role: 'TEACHER',
      isActive: profile.user?.status === UserStatus.ACTIVE,
      createdAt: profile.createdAt,
      teacherProfile: {
        id: profile.id,
        department: profile.qualification || profile.subjectExpertise?.[0] || null,
        qualification: profile.qualification || null,
        subjectExpertise: profile.subjectExpertise || [],
        classesTeach: profile.classesTeach || [],
      },
    };
  }

  private toAttendanceView(record: any, student?: any) {
    const studentId = student?.id || record.studentId;
    const className = record.className || student?.studentProfile?.section?.class?.name || 'Class';
    return {
      id: `att_${record.studentId}_${record.date || record.className || 'today'}`,
      date: record.date || new Date().toISOString().split('T')[0],
      status: record.status || (record.present > 0 ? 'PRESENT' : 'ABSENT'),
      remarks: record.remarks || '',
      user: {
        id: studentId,
        name: record.name || student?.name || 'Student',
        role: 'STUDENT',
        studentProfile: {
          section: {
            class: { id: className, name: className },
            name: 'A',
          },
        },
      },
    };
  }

  private async queryFeeRows(query: Record<string, any>) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 50)));
    const offset = (page - 1) * limit;
    const filters: string[] = ['e.deleted_at IS NULL'];
    const params: any[] = [];
    let index = 1;

    if (query.tenantId) {
      filters.push(`e.tenant_id = $${index++}`);
      params.push(query.tenantId);
    }

    if (query.batchId) {
      filters.push(`e.batch_id = $${index++}`);
      params.push(query.batchId);
    }

    if (query.search) {
      filters.push(`(LOWER(u.name) LIKE LOWER($${index}) OR LOWER(u.email) LIKE LOWER($${index}) OR u.phone LIKE $${index})`);
      params.push(`%${String(query.search)}%`);
      index += 1;
    }

    const where = filters.join(' AND ');
    const rows = await this.dataSource.query(
      `
      SELECT
        e.id              AS enrollment_id,
        e.status          AS enrollment_status,
        e.enrolled_at,
        e.fee_paid,
        e.fee_paid_at,

        s.id              AS student_id,
        u.name            AS student_name,
        u.email           AS student_email,
        u.phone           AS student_phone,
        s.care_of         AS care_of,
        s.city            AS city,
        s.state           AS state,
        s.pin_code        AS pin_code,

        b.id              AS batch_id,
        b.name            AS batch_name,
        b.exam_target     AS exam_target,
        b.fee_amount      AS batch_fee,
        b.start_date      AS batch_start_date,
        b.end_date        AS batch_end_date,
        b.class           AS batch_class,

        t.id              AS tenant_id,
        t.name            AS institute_name,
        t.subdomain       AS institute_subdomain
      FROM enrollments e
      JOIN students   s ON s.id = e.student_id
      JOIN users      u ON u.id = s.user_id
      JOIN batches    b ON b.id = e.batch_id
      JOIN tenants    t ON t.id = e.tenant_id
      WHERE ${where}
      ORDER BY e.enrolled_at DESC
      LIMIT $${index++} OFFSET $${index++}
      `,
      [...params, limit, offset],
    );

    return rows;
  }

  private async fetchFeeRow(enrollmentId: string) {
    const rows = await this.dataSource.query(
      `
      SELECT
        e.id              AS enrollment_id,
        e.status          AS enrollment_status,
        e.enrolled_at,
        e.fee_paid,
        e.fee_paid_at,

        s.id              AS student_id,
        u.name            AS student_name,
        u.email           AS student_email,
        u.phone           AS student_phone,
        s.care_of         AS care_of,
        s.city            AS city,
        s.state           AS state,
        s.pin_code        AS pin_code,

        b.id              AS batch_id,
        b.name            AS batch_name,
        b.exam_target     AS exam_target,
        b.fee_amount      AS batch_fee,
        b.start_date      AS batch_start_date,
        b.end_date        AS batch_end_date,
        b.class           AS batch_class,

        t.id              AS tenant_id,
        t.name            AS institute_name,
        t.subdomain       AS institute_subdomain
      FROM enrollments e
      JOIN students   s ON s.id = e.student_id
      JOIN users      u ON u.id = s.user_id
      JOIN batches    b ON b.id = e.batch_id
      JOIN tenants    t ON t.id = e.tenant_id
      WHERE e.id = $1
      LIMIT 1
      `,
      [enrollmentId],
    );

    return rows[0];
  }

  private toInstituteSummary(tenant: Tenant) {
    return {
      id: tenant.id,
      name: tenant.name,
      status: this.toTenantStatusView(tenant.status),
      tenantDomain: tenant.subdomain,
      city: tenant.city,
      state: tenant.state,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    };
  }

  private async toInstituteView(tenant: Tenant) {
    const [userCount, adminUser] = await Promise.all([
      this.userRepo.count({ where: { tenantId: tenant.id } }),
      this.userRepo.findOne({ where: { tenantId: tenant.id, role: UserRole.INSTITUTE_ADMIN } }),
    ]);

    const metadata = (tenant.metadata || {}) as Record<string, any>;

    return {
      id: tenant.id,
      name: tenant.name,
      tenantDomain: tenant.subdomain,
      status: this.toTenantStatusView(tenant.status),
      subscriptionPlan: this.toTenantPlanView(tenant.plan),
      city: tenant.city,
      state: tenant.state,
      email: metadata.email || tenant.billingEmail || adminUser?.email || null,
      phone: metadata.phone || null,
      alternatePhone: metadata.alternatePhone || null,
      principalName: metadata.principalName || metadata.adminName || adminUser?.fullName || null,
      adminName: metadata.adminName || adminUser?.fullName || null,
      adminEmail: metadata.adminEmail || adminUser?.email || tenant.billingEmail || null,
      registrationNo: metadata.registrationNo || null,
      plotNo: metadata.plotNo || null,
      streetName: metadata.streetName || null,
      landMark: metadata.landMark || null,
      district: metadata.district || null,
      pinCode: metadata.pinCode || null,
      website: metadata.website || null,
      academicSession: metadata.academicSession || null,
      timezone: metadata.timezone || 'Asia/Kolkata',
      language: metadata.language || 'en',
      currency: metadata.currency || 'INR',
      logo: metadata.logo || tenant.logoUrl || '',
      modulesPermissions: metadata.modulesPermissions || { dashboard: true, academics: true, calendar: true, timetable: true, fees: true, communications: true, reports: true, liveClasses: true },
      _count: { users: userCount },
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    };
  }

  private toNoticeView(announcement: Announcement, payload?: Record<string, any>) {
    const extras = payload ? this.extractNoticeExtras(payload) : this.noticeExtras.get(announcement.id) || {};
    return {
      id: announcement.id,
      title: announcement.title,
      content: announcement.body,
      category: extras.category || 'GENERAL',
      priority: extras.priority || 'NORMAL',
      postedDate: extras.postedDate || announcement.createdAt,
      expiryDate: extras.expiryDate || announcement.expiresAt || null,
      targetRoles: extras.targetRoles || this.normalizeTargetRoles(announcement.targetRole),
      attachments: extras.attachments || {},
      createdAt: announcement.createdAt,
      updatedAt: announcement.updatedAt,
    };
  }

  private toFeeView(row: Record<string, any>) {
    const amount = Number(row?.batch_fee || 0);
    const paidAmount = Number(row?.fee_paid || 0);
    const remainingBalance = Math.max(0, amount - paidAmount);
    const dueDate = row?.batch_end_date || row?.batch_start_date || row?.enrolled_at || new Date().toISOString();
    const status = this.computeFeeStatus(remainingBalance, dueDate, paidAmount, amount);

    return {
      id: row.enrollment_id,
      title: `${row.batch_name || 'Batch'} Fee`,
      amount,
      paidAmount,
      remainingBalance,
      dueDate,
      paymentDate: row.fee_paid_at || null,
      latestTransaction: row.fee_paid_at
        ? { paymentDate: row.fee_paid_at, amount: paidAmount, paymentMethod: 'CASH' }
        : null,
      status,
      student: {
        id: row.student_id,
        enrollmentNo: String(row.student_id || '').slice(0, 8).toUpperCase(),
        user: { name: row.student_name, email: row.student_email },
        studentProfile: {
          section: {
            class: { name: row.batch_class || '-' },
            name: row.batch_name || '-',
          },
          rollNo: String(row.student_id || '').slice(0, 6).toUpperCase(),
        },
      },
      batch: {
        id: row.batch_id,
        name: row.batch_name,
        examTarget: row.exam_target,
      },
      institute: {
        id: row.tenant_id,
        name: row.institute_name,
        tenantDomain: row.institute_subdomain,
      },
      createdAt: row.enrolled_at,
      updatedAt: row.fee_paid_at || row.enrolled_at,
    };
  }

  private computeFeeStatus(remainingBalance: number, dueDate: string, paidAmount: number, amount: number) {
    if (paidAmount >= amount && amount > 0) return 'PAID';
    if (paidAmount > 0 && remainingBalance > 0) return 'PARTIAL';
    if (new Date(dueDate).getTime() < Date.now() && remainingBalance > 0) return 'OVERDUE';
    return 'PENDING';
  }

  private buildFeeStatusBreakdown(rows: any[]) {
    const counts = rows.reduce((acc, row) => {
      const fee = this.toFeeView(row);
      acc[fee.status] = (acc[fee.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'PAID', value: counts.PAID || 0 },
      { name: 'PARTIAL', value: counts.PARTIAL || 0 },
      { name: 'PENDING', value: counts.PENDING || 0 },
      { name: 'OVERDUE', value: counts.OVERDUE || 0 },
    ];
  }

  private buildFeeRevenueTrend(rows: any[]) {
    const byMonth = new Map<string, { name: string; collected: number; pending: number }>();

    for (const row of rows) {
      const fee = this.toFeeView(row);
      const month = new Date(fee.createdAt).toLocaleString('en-US', { month: 'short' });
      const bucket = byMonth.get(month) || { name: month, collected: 0, pending: 0 };
      bucket.collected += fee.paidAmount;
      bucket.pending += fee.remainingBalance;
      byMonth.set(month, bucket);
    }

    return Array.from(byMonth.values()).slice(-6);
  }

  private async calculateMonthlyRevenue(tenantId?: string) {
    if (tenantId) {
      const result = await this.dataSource.query(
        `SELECT COALESCE(SUM(fee_paid), 0)::numeric AS revenue FROM enrollments WHERE deleted_at IS NULL AND tenant_id = $1`,
        [tenantId]
      );
      return Number(result?.[0]?.revenue || 0);
    }
    const result = await this.dataSource.query(
      `SELECT COALESCE(SUM(fee_paid), 0)::numeric AS revenue FROM enrollments WHERE deleted_at IS NULL`,
    );
    return Number(result?.[0]?.revenue || 0);
  }

  private buildMonthlyTrend(tenants: Tenant[]) {
    const months = Array.from({ length: 6 }, (_, offset) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - offset));
      return date.toLocaleString('en-US', { month: 'short' });
    });

    return months.map((name, index) => ({
      name,
      institutes: tenants.filter((tenant) => new Date(tenant.createdAt).getMonth() === new Date().getMonth() - (5 - index)).length,
      approved: tenants.filter((tenant) => tenant.status === TenantStatus.ACTIVE).length,
    }));
  }

  private buildRevenueTrend(tenants: Tenant[]) {
    return tenants.slice(0, 6).map((tenant) => ({
      name: tenant.subdomain || tenant.name,
      value: Number(tenant.metadata?.monthlyRevenue || 0),
    }));
  }

  private buildRecentActivity(tenants: Tenant[], users: User[]) {
    return [
      ...tenants.slice(0, 3).map((tenant) => ({
        id: `activity_tenant_${tenant.id}`,
        label: `Institute ${tenant.name} updated`,
        timestamp: tenant.updatedAt,
      })),
      ...users.slice(0, 3).map((user) => ({
        id: `activity_user_${user.id}`,
        label: `${user.fullName} logged in`,
        timestamp: user.lastLoginAt || user.updatedAt,
      })),
    ];
  }

  private async getRoleCounts() {
    const [superAdmin, instituteAdmin, teacher, student, parent] = await Promise.all([
      this.userRepo.count({ where: { role: UserRole.SUPER_ADMIN } }),
      this.userRepo.count({ where: { role: UserRole.INSTITUTE_ADMIN } }),
      this.userRepo.count({ where: { role: UserRole.TEACHER } }),
      this.userRepo.count({ where: { role: UserRole.STUDENT } }),
      this.userRepo.count({ where: { role: UserRole.PARENT } }),
    ]);

    return { super_admin: superAdmin, institute_admin: instituteAdmin, teacher, student, parent };
  }

  private toTenantStatus(status: string) {
    const value = String(status || '').toUpperCase();
    if (value === 'ACTIVE') return TenantStatus.ACTIVE;
    if (value === 'SUSPENDED') return TenantStatus.SUSPENDED;
    return TenantStatus.TRIAL;
  }

  private toTenantStatusView(status: TenantStatus) {
    switch (status) {
      case TenantStatus.ACTIVE:
        return 'ACTIVE';
      case TenantStatus.SUSPENDED:
        return 'SUSPENDED';
      default:
        return 'PENDING';
    }
  }

  private toTenantPlan(value: any) {
    const plan = String(value || '').toUpperCase();
    if (plan === 'FREE' || plan === 'STARTER') return TenantPlan.STARTER;
    if (plan === 'GROWTH') return TenantPlan.GROWTH;
    if (plan === 'SCALE') return TenantPlan.SCALE;
    if (plan === 'ENTERPRISE') return TenantPlan.ENTERPRISE;
    if (plan === 'PLATFORM') return TenantPlan.PLATFORM;
    return TenantPlan.STARTER;
  }

  private toTenantPlanView(plan: TenantPlan) {
    if (plan === TenantPlan.STARTER) return 'FREE';
    return plan.toUpperCase();
  }

  private normalizeUserRole(role: string) {
    const value = String(role || '').toLowerCase();
    if (value === 'super_admin' || value === 'super admin') return UserRole.SUPER_ADMIN;
    if (value === 'institute_admin' || value === 'institute admin' || value === 'admin') return UserRole.INSTITUTE_ADMIN;
    if (value === 'teacher') return UserRole.TEACHER;
    if (value === 'student') return UserRole.STUDENT;
    if (value === 'parent') return UserRole.PARENT;
    return undefined;
  }

  private normalizeTargetRole(targetRoles: any) {
    const normalized = this.normalizeTargetRoles(targetRoles);
    return normalized[0] ? normalized[0].toLowerCase() : 'all';
  }

  private normalizeTargetRoles(value: any) {
    if (!value) return [];
    if (Array.isArray(value)) return value.map((item) => String(item).toUpperCase());
    if (typeof value === 'string') return [value.toUpperCase()];
    return [];
  }

  private normalizeComplaintStatus(value: any) {
    const status = String(value || '').toUpperCase();
    if (status === 'IN_PROGRESS' || status === 'RESOLVED' || status === 'CLOSED' || status === 'OPEN') {
      return status as ComplaintRecord['status'];
    }
    return undefined;
  }

  private buildTenantMetadata(payload: Record<string, any>) {
    return {
      principalName: payload.principalName || payload.adminName || null,
      registrationNo: payload.registrationNo || null,
      email: payload.email || null,
      phone: payload.phone || null,
      alternatePhone: payload.alternatePhone || null,
      plotNo: payload.plotNo || null,
      streetName: payload.streetName || null,
      landMark: payload.landMark || null,
      district: payload.district || null,
      pinCode: payload.pinCode || null,
      website: payload.website || null,
      academicSession: payload.academicSession || null,
      timezone: payload.timezone || 'Asia/Kolkata',
      language: payload.language || 'en',
      currency: payload.currency || 'INR',
      logo: payload.logo || '',
      adminName: payload.adminName || payload.principalName || null,
      adminEmail: payload.adminEmail || payload.email || null,
      modulesPermissions: payload.modulesPermissions || {
        dashboard: true,
        academics: true,
        calendar: true,
        timetable: true,
        fees: true,
        communications: true,
        reports: true,
        liveClasses: true,
      },
    };
  }

  private extractNoticeExtras(payload: Record<string, any>): NoticeExtras {
    return {
      category: payload.category || 'GENERAL',
      priority: payload.priority || 'NORMAL',
      postedDate: payload.postedDate || new Date().toISOString(),
      expiryDate: payload.expiryDate || null,
      targetRoles: this.normalizeTargetRoles(payload.targetRoles),
      attachments: payload.attachments || {},
    };
  }

  private async upsertInstituteAdmin(tenantId: string, payload: Record<string, any>) {
    const adminEmail = payload.adminEmail || payload.email;
    const adminName = payload.adminName || payload.principalName || payload.instituteName || payload.name;
    if (!adminEmail && !adminName && !payload.adminPassword) return;

    const existing = await this.userRepo.findOne({ where: { tenantId, role: UserRole.INSTITUTE_ADMIN } });
    const nextPhone = payload.phone || `9${Date.now().toString().slice(-9)}`;

    if (existing) {
      existing.email = adminEmail || existing.email;
      existing.fullName = adminName || existing.fullName;
      if (payload.adminPassword) existing.password = payload.adminPassword;
      existing.status = UserStatus.ACTIVE;
      await this.userRepo.save(existing);
      return;
    }

    await this.userRepo.save(
      this.userRepo.create({
        tenantId,
        phoneNumber: nextPhone,
        email: adminEmail || null,
        fullName: adminName || 'Institute Admin',
        password: payload.adminPassword || undefined,
        role: UserRole.INSTITUTE_ADMIN,
        status: UserStatus.ACTIVE,
        phoneVerified: true,
        emailVerified: !!adminEmail,
        isFirstLogin: false,
      }),
    );
  }

  private slugify(value: string) {
    return String(value || 'institute')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'institute';
  }

  private toChatPeer(user: User) {
    const unreadCount = this.chatMessages.filter((message) => message.sender_id === user.id && !message.readAt).length;
    return {
      id: user.id,
      name: user.fullName,
      email: user.email,
      role: user.role,
      unread_count: unreadCount,
      last_message: this.getLastMessageSummary(user.id),
    };
  }

  private toConversation(user: User, currentUserId?: string) {
    const lastMessage = this.getLastMessage(user.id, currentUserId);
    return {
      id: user.id,
      name: user.fullName,
      email: user.email,
      role: user.role,
      unread_count: this.chatMessages.filter((message) => message.sender_id === user.id && message.receiver_id === currentUserId && !message.readAt).length,
      last_message: lastMessage?.content || '',
      last_message_at: lastMessage?.createdAt || null,
    };
  }

  private getLastMessageSummary(peerId: string) {
    const lastMessage = [...this.chatMessages]
      .filter((message) => message.sender_id === peerId || message.receiver_id === peerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

    return lastMessage?.content || '';
  }

  private getLastMessage(peerId: string, currentUserId?: string) {
    return [...this.chatMessages]
      .filter((message) =>
        (message.sender_id === peerId && message.receiver_id === currentUserId) ||
        (message.sender_id === currentUserId && message.receiver_id === peerId),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  }
}