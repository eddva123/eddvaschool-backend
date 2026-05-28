import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeacherDataStore } from '../../database/entities/teacher-data-store.entity';

// --- Domain Type Contracts ---

export interface BaseStoreItem {
  id: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

export interface AttendanceItem extends BaseStoreItem {
  studentId: string;
  name: string;
  className: string;
  present: number;
  absent: number;
  late: number;
  percentage: number;
  date: string;
  status: string;
  remarks: string;
}

export interface AssignmentItem extends BaseStoreItem {
  tenantId: string;
  title: string;
  type: string;
  class_id: string;
  class_name: string;
  subject_id: string;
  subject_name: string;
  due_date: string;
  instructions: string;
  status: string;
}

export interface ScheduleItem extends BaseStoreItem {
  tenantId: string;
  subject_name: string;
  class_name: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  type: string;
  zoom_link: string;
  google_meet_link: string;
  live_status: string;
  created_at: string;
}

export interface MaterialItem extends BaseStoreItem {
  title: string;
  chapter_id: string;
  uploadedAt: string;
}

export interface EventItem extends BaseStoreItem {
  tenantId: string;
  title: string;
  startTime: string;
  endTime: string;
  category: string;
  description: string;
  location: string;
  priority: string;
  createdAt: string;
}

export interface GrievanceItem extends BaseStoreItem {
  tenantId: string;
  title: string;
  category: string;
  priority: string;
  description: string;
  status: string;
  raised_by_name: string;
  created_at: string;
}

export interface TopicItem extends BaseStoreItem {
  tenantId: string;
  name: string;
  subject_id: string;
  subject_name: string;
  status: string;
  progress: number;
  chapters: any[];
}

export interface VersionedDataStore<T> {
  version: number;
  updatedAt: string;
  items: T[];
}

@Injectable()
export class TeacherDataStoreService {
  constructor(
    @InjectRepository(TeacherDataStore)
    private readonly dataStoreRepo: Repository<TeacherDataStore>,
  ) {}

  // --- Abstraction Access Layer ---

  async getData<T extends BaseStoreItem>(tenantId: string, category: string, defaultData: T[]): Promise<VersionedDataStore<T>> {
    const record = await this.dataStoreRepo.findOne({
      where: { tenantId, category },
    });

    if (record) {
      let payload = record.data;
      // Dynamic on-the-fly legacy format migration to VersionedDataStore
      if (Array.isArray(payload)) {
        payload = {
          version: 1,
          updatedAt: record.updatedAt?.toISOString() || new Date().toISOString(),
          items: payload,
        };
        record.data = payload;
        await this.dataStoreRepo.save(record);
      }
      return payload as VersionedDataStore<T>;
    }

    // First-read initialization: persist and return default format
    const initialPayload: VersionedDataStore<T> = {
      version: 1,
      updatedAt: new Date().toISOString(),
      items: defaultData,
    };

    const newRecord = this.dataStoreRepo.create({
      tenantId,
      category,
      data: initialPayload,
    });
    await this.dataStoreRepo.save(newRecord);
    return initialPayload;
  }

  async saveData<T extends BaseStoreItem>(tenantId: string, category: string, items: T[], userId?: string): Promise<void> {
    // strict DTO validation guard BEFORE database write
    this.validateItems(category, items);

    let record = await this.dataStoreRepo.findOne({
      where: { tenantId, category },
    });

    const payload: VersionedDataStore<T> = {
      version: 1,
      updatedAt: new Date().toISOString(),
      items,
    };

    if (record) {
      record.data = payload;
    } else {
      record = this.dataStoreRepo.create({
        tenantId,
        category,
        data: payload,
      });
    }

    await this.dataStoreRepo.save(record);
    this.logAction(userId || 'system', tenantId, 'SAVE', category);
  }

  // --- Generic Paginated Search & Filtering Paginator ---

  paginate<T extends BaseStoreItem>(items: T[], query: Record<string, any>) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || query.perPage || 20)));
    const skip = (page - 1) * limit;

    // Filter soft deleted items by default
    let filtered = items.filter(item => !item.isDeleted);

    // Status filter
    if (query.status && query.status !== 'ALL') {
      filtered = filtered.filter((item: any) => String(item.status).toUpperCase() === String(query.status).toUpperCase());
    }

    // Case-insensitive Search query
    if (query.search) {
      const term = String(query.search).toLowerCase();
      filtered = filtered.filter((item: any) =>
        String(item.title || item.name || item.description || '').toLowerCase().includes(term)
      );
    }

    // Priority filter (if present)
    if (query.priority && query.priority !== 'ALL') {
      filtered = filtered.filter((item: any) => String(item.priority).toUpperCase() === String(query.priority).toUpperCase());
    }

    // Category filter (if present)
    if (query.category && query.category !== 'ALL') {
      filtered = filtered.filter((item: any) => String(item.category).toUpperCase() === String(query.category).toUpperCase());
    }

    // Sorting (latest first by default)
    const sortBy = query.sortBy || 'createdAt' || 'created_at' || 'startTime' || 'uploadedAt';
    const sortOrder = query.sortOrder || 'DESC';
    filtered.sort((a: any, b: any) => {
      const valA = a[sortBy] || '';
      const valB = b[sortBy] || '';
      if (sortOrder === 'DESC') {
        return String(valB).localeCompare(String(valA));
      }
      return String(valA).localeCompare(String(valB));
    });

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + limit);

    return {
      items: paginated,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 0,
      }
    };
  }

  // --- Strict Validation Guards ---

  private validateItems(category: string, items: any[]): void {
    if (!Array.isArray(items)) {
      throw new BadRequestException(`Data for category ${category} must be an array`);
    }

    for (const item of items) {
      if (!item.id) {
        throw new BadRequestException(`Item in category ${category} is missing a unique 'id'`);
      }

      switch (category) {
        case 'assignments':
          if (!item.title || !item.due_date || !item.class_id || !item.subject_id) {
            throw new BadRequestException(`Malformed AssignmentItem: missing required fields in ${JSON.stringify(item)}`);
          }
          break;
        case 'attendance':
          if (!item.studentId || !item.date || !item.status) {
            throw new BadRequestException(`Malformed AttendanceItem: missing required fields in ${JSON.stringify(item)}`);
          }
          break;
        case 'schedules':
          if (!item.day_of_week || !item.start_time || !item.end_time) {
            throw new BadRequestException(`Malformed ScheduleItem: missing required fields in ${JSON.stringify(item)}`);
          }
          break;
        case 'events':
          if (!item.title || !item.startTime || !item.category) {
            throw new BadRequestException(`Malformed EventItem: missing required fields in ${JSON.stringify(item)}`);
          }
          break;
        case 'grievances':
          if (!item.title || !item.category || !item.priority) {
            throw new BadRequestException(`Malformed GrievanceItem: missing required fields in ${JSON.stringify(item)}`);
          }
          break;
        case 'topics':
          if (!item.name || !item.subject_id) {
            throw new BadRequestException(`Malformed TopicItem: missing required fields in ${JSON.stringify(item)}`);
          }
          break;
        case 'materials':
          if (!item.title || !item.chapter_id) {
            throw new BadRequestException(`Malformed MaterialItem: missing required fields in ${JSON.stringify(item)}`);
          }
          break;
      }
    }
  }

  // --- Lightweight Audit Logging & Cache Hooks ---

  private logAction(userId: string, tenantId: string, action: string, category: string) {
    console.log(`[AUDIT LOG] [${new Date().toISOString()}] User: ${userId} | Tenant: ${tenantId} | Action: ${action} | Category: ${category}`);
  }

  // Redis Cache Hooks extension point
  async getCacheKey(tenantId: string, category: string): Promise<string> {
    return `teacher_datastore:${tenantId}:${category}`;
  }
}
