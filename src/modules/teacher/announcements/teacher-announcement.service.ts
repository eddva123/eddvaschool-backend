import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from '../../../database/entities/announcement.entity';
import { TeacherCacheService } from '../common/teacher-cache.service';

@Injectable()
export class TeacherAnnouncementService {
  constructor(
    @InjectRepository(Announcement)
    private readonly announcementRepo: Repository<Announcement>,
    private readonly cacheService: TeacherCacheService,
  ) {}

  // ── Single source of truth for teacher announcement retrieval ─────────────

  async getAnnouncementsForTeacher(query: Record<string, any>, user: any) {
    const tenantId = user?.tenantId || query.tenantId || 'global';
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(query.limit || query.perPage || 10)));
    const skip = (page - 1) * limit;
    const priority = typeof query.priority === 'string' ? query.priority.toUpperCase() : null;

    const cacheKey = this.cacheService.formatKey(
      tenantId,
      'announcements',
      `${priority || 'ALL'}:${page}:${limit}`
    );

    // Try cache first
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const startTime = Date.now();

    const qb = this.announcementRepo.createQueryBuilder('a')
      .where('(a.target_role = :teacher OR a.target_role = :all)', { teacher: 'teacher', all: 'all' });

    if (tenantId && tenantId !== 'global') {
      qb.andWhere('a.tenant_id = :tenantId', { tenantId });
    }
    if (priority && priority !== 'ALL') {
      qb.andWhere('a.priority = :priority', { priority });
    }

    qb.orderBy('a.created_at', 'DESC').skip(skip).take(limit);
    const [announcements, total] = await qb.getManyAndCount();

    const now = Date.now();
    const data = announcements.map(a => this.toAnnouncementView(a, now));

    const result = {
      data,
      announcements: data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 0 },
    };

    this.logTiming('getAnnouncementsForTeacher', tenantId, user?.id, Date.now() - startTime);

    // Save to cache for 120 seconds (120000ms)
    await this.cacheService.set(cacheKey, result, 120 * 1000);

    return result;
  }

  async getDashboardAnnouncements(tenantId: string, limit = 5) {
    const announcements = await this.announcementRepo.find({
      where: [
        { tenantId, targetRole: 'teacher' },
        { tenantId, targetRole: 'all' },
      ],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    const now = Date.now();
    return announcements.map(a => this.toAnnouncementView(a, now));
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private toAnnouncementView(a: Announcement, now: number) {
    return {
      id: a.id,
      title: a.title,
      detail: a.body ? a.body.slice(0, 120) : '',
      time: a.createdAt,
      tone: a.targetRole === 'all' ? 'success' : 'info',
      unread: (now - new Date(a.createdAt).getTime()) < 48 * 60 * 60 * 1000,
      priority: (a as any).priority || 'NORMAL',
    };
  }

  private logTiming(action: string, tenantId: string, userId: string, ms: number) {
    console.log(`[OBSERVABILITY] [${new Date().toISOString()}] Module: TeacherAnnouncement | Action: ${action} | Tenant: ${tenantId} | User: ${userId} | Duration: ${ms}ms`);
  }
}
