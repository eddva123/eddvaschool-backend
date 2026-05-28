import { Injectable } from '@nestjs/common';
import { TeacherDataStoreService, ScheduleItem, TopicItem, MaterialItem } from '../../compat/teacher-datastore.service';

@Injectable()
export class TeacherCreatorStudioService {
  constructor(private readonly dataStoreService: TeacherDataStoreService) {}

  // ── Single source of truth: topics and chapters ──────────────────────────

  async getTopics(user: any) {
    const tenantId = user?.tenantId;
    const store = await this.dataStoreService.getData<TopicItem>(tenantId, 'topics', []);
    return { data: store.items.filter(t => !t.isDeleted) };
  }

  async createTopic(payload: Record<string, any>, user: any) {
    const tenantId = user?.tenantId;
    const newTopic: TopicItem = {
      id: `topic_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      tenantId,
      name: payload.name,
      subject_id: payload.subject_id,
      subject_name: payload.subject_name || 'Subject',
      status: 'active',
      progress: 0,
      chapters: [],
    };

    const store = await this.dataStoreService.getData<TopicItem>(tenantId, 'topics', []);
    store.items.push(newTopic);
    await this.dataStoreService.saveData(tenantId, 'topics', store.items, user?.id);
    return { data: newTopic };
  }

  async getTopicById(id: string, user: any) {
    const tenantId = user?.tenantId;
    const store = await this.dataStoreService.getData<TopicItem>(tenantId, 'topics', []);
    const topic = store.items.find(t => t.id === id);
    if (!topic) throw new Error(`Topic ${id} not found`);
    return { data: topic };
  }

  async createTopicChapter(topicId: string, payload: Record<string, any>, user: any) {
    const tenantId = user?.tenantId;
    const store = await this.dataStoreService.getData<TopicItem>(tenantId, 'topics', []);
    const topic = store.items.find(t => t.id === topicId);
    if (!topic) throw new Error(`Topic ${topicId} not found`);

    const newChapter = {
      id: `chap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: payload.name,
      order: payload.order,
      status: 'active',
      progress: 0,
    };
    topic.chapters = topic.chapters || [];
    topic.chapters.push(newChapter);
    await this.dataStoreService.saveData(tenantId, 'topics', store.items, user?.id);
    return { data: newChapter };
  }

  async uploadMaterial(payload: Record<string, any>, user: any) {
    const tenantId = user?.tenantId;
    const newMaterial: MaterialItem = {
      id: `mat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: payload.title,
      chapter_id: payload.chapter_id,
      uploadedAt: new Date().toISOString(),
    };

    const store = await this.dataStoreService.getData<MaterialItem>(tenantId, 'materials', []);
    store.items.push(newMaterial);
    await this.dataStoreService.saveData(tenantId, 'materials', store.items, user?.id);
    return { data: newMaterial, message: 'Material uploaded successfully' };
  }
}
