import { Injectable } from '@nestjs/common';
import { TeacherDataStoreService, ScheduleItem, EventItem } from '../../compat/teacher-datastore.service';

@Injectable()
export class TeacherLiveClassesService {
  constructor(private readonly dataStoreService: TeacherDataStoreService) {}

  // ── Single source of truth: schedules, recordings, events ────────────────

  async getSchedules(user: any) {
    const tenantId = user?.tenantId;
    const store = await this.dataStoreService.getData<ScheduleItem>(tenantId, 'schedules', []);
    return { data: store.items.filter(s => !s.isDeleted) };
  }

  async createSchedule(payload: Record<string, any>, user: any) {
    const tenantId = user?.tenantId;
    const newSchedule: ScheduleItem = {
      id: `sched_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      tenantId,
      subject_name: payload.subject_id || 'Subject',
      class_name: payload.class_id || 'Class',
      day_of_week: payload.day_of_week,
      start_time: payload.start_time,
      end_time: payload.end_time,
      type: payload.type,
      zoom_link: payload.zoom_link || '',
      google_meet_link: payload.google_meet_link || '',
      live_status: payload.live_status || 'scheduled',
      created_at: new Date().toISOString(),
    };

    const store = await this.dataStoreService.getData<ScheduleItem>(tenantId, 'schedules', []);
    store.items.push(newSchedule);
    await this.dataStoreService.saveData(tenantId, 'schedules', store.items, user?.id);
    return { data: newSchedule };
  }

  async getRecordings(user: any) {
    const tenantId = user?.tenantId;
    const store = await this.dataStoreService.getData<any>(tenantId, 'recordings', []);
    return { data: store.items.filter((r: any) => !r.isDeleted) };
  }

  async getEvents(query: Record<string, any>, user: any) {
    const tenantId = user?.tenantId || query.tenantId;
    if (!tenantId) return [];

    const category = typeof query.category === 'string' ? query.category : 'All';
    const from = query.from ? new Date(query.from) : null;
    const to = query.to ? new Date(query.to) : null;

    const store = await this.dataStoreService.getData<EventItem>(tenantId, 'events', []);
    return store.items
      .filter(e => !e.isDeleted)
      .filter(e => category === 'All' || e.category === category)
      .filter(e => !from || new Date(e.startTime) >= from)
      .filter(e => !to || new Date(e.startTime) <= to)
      .sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));
  }

  async createEvent(payload: Record<string, any>, user: any) {
    const tenantId = user?.tenantId || payload.tenantId || 'platform';
    const event: EventItem = {
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

    const store = await this.dataStoreService.getData<EventItem>(tenantId, 'events', []);
    store.items.unshift(event);
    await this.dataStoreService.saveData(tenantId, 'events', store.items, user?.id);
    return event;
  }

  async deleteEvent(id: string, user: any) {
    const tenantId = user?.tenantId;
    if (!tenantId) throw new Error('Tenant context required');

    const store = await this.dataStoreService.getData<EventItem>(tenantId, 'events', []);
    const idx = store.items.findIndex(e => e.id === id);
    if (idx === -1) throw new Error(`Event ${id} not found`);

    store.items[idx].isDeleted = true;
    store.items[idx].deletedAt = new Date().toISOString();
    store.items[idx].deletedBy = user?.id || 'system';
    await this.dataStoreService.saveData(tenantId, 'events', store.items, user?.id);
    return { success: true };
  }
}
