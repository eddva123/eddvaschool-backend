import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Question, QuestionOption, QuestionSource } from '../../../database/entities/question.entity';
import { CreateQuestionDto, UpdateQuestionDto, QuestionBankQueryDto } from './dto/question-bank.dto';

@Injectable()
export class TeacherQuestionBankService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
    @InjectRepository(QuestionOption)
    private readonly optionRepo: Repository<QuestionOption>,
  ) {}

  /**
   * Get paginated, filterable list of questions
   */
  async getQuestions(tenantId: string, queryDto: QuestionBankQueryDto) {
    const {
      subjectId,
      chapterId,
      topicId,
      difficulty,
      type,
      source,
      search,
      page = 1,
      limit = 10,
    } = queryDto;

    const query = this.questionRepo.createQueryBuilder('question')
      .leftJoinAndSelect('question.options', 'options')
      .where('question.isActive = :isActive', { isActive: true });

    // Enforce tenant boundary or allow global bank access
    query.andWhere('(question.tenantId = :tenantId OR question.isGlobal = true)', { tenantId });

    if (subjectId) {
      query.andWhere('question.subjectId = :subjectId', { subjectId });
    }
    if (chapterId) {
      query.andWhere('question.chapterId = :chapterId', { chapterId });
    }
    if (topicId) {
      query.andWhere('question.topicId = :topicId', { topicId });
    }
    if (difficulty) {
      query.andWhere('question.difficulty = :difficulty', { difficulty });
    }
    if (type) {
      query.andWhere('question.type = :type', { type });
    }
    if (source) {
      query.andWhere('question.source = :source', { source });
    }
    if (search) {
      query.andWhere('question.content ILIKE :search', { search: `%${search}%` });
    }

    // Sort by creation date descending to show newest first
    query.orderBy('question.createdAt', 'DESC');

    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    const [items, total] = await query.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
    };
  }

  /**
   * Get a single question by ID
   */
  async getQuestionById(id: string, tenantId: string): Promise<Question> {
    const question = await this.questionRepo.findOne({
      where: [
        { id, tenantId, isActive: true },
        { id, isGlobal: true, isActive: true },
      ],
      relations: ['options'],
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found or not accessible.`);
    }

    return question;
  }

  /**
   * Create a new question and its options in a transaction
   */
  async createQuestion(dto: CreateQuestionDto, user: any): Promise<Question> {
    const tenantId = user.tenantId;

    const question = this.questionRepo.create({
      tenantId,
      subjectId: dto.subjectId,
      chapterId: dto.chapterId,
      topicId: dto.topicId,
      content: dto.content,
      contentImageUrl: dto.contentImageUrl,
      solutionText: dto.solutionText,
      solutionVideoUrl: dto.solutionVideoUrl,
      type: dto.type,
      difficulty: dto.difficulty,
      marksCorrect: dto.marksCorrect ?? 4,
      marksWrong: dto.marksWrong ?? -1,
      integerAnswer: dto.integerAnswer,
      tags: dto.tags ?? [],
      source: QuestionSource.TEACHER,
      isActive: true,
    });

    if (dto.options && dto.options.length > 0) {
      question.options = dto.options.map(opt => this.optionRepo.create({
        optionLabel: opt.optionLabel,
        content: opt.content,
        contentImageUrl: opt.contentImageUrl,
        isCorrect: opt.isCorrect,
        sortOrder: opt.sortOrder ?? 0,
      }));
    }

    return this.questionRepo.save(question);
  }

  /**
   * Update a question and replace its options in a transaction
   */
  async updateQuestion(id: string, dto: UpdateQuestionDto, user: any): Promise<Question> {
    const tenantId = user.tenantId;

    const question = await this.questionRepo.findOne({
      where: { id, tenantId, isActive: true },
      relations: ['options'],
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found or not accessible for update.`);
    }

    // Update basic question fields
    if (dto.subjectId !== undefined) question.subjectId = dto.subjectId;
    if (dto.chapterId !== undefined) question.chapterId = dto.chapterId;
    if (dto.topicId !== undefined) question.topicId = dto.topicId;
    if (dto.content !== undefined) question.content = dto.content;
    if (dto.contentImageUrl !== undefined) question.contentImageUrl = dto.contentImageUrl;
    if (dto.solutionText !== undefined) question.solutionText = dto.solutionText;
    if (dto.solutionVideoUrl !== undefined) question.solutionVideoUrl = dto.solutionVideoUrl;
    if (dto.type !== undefined) question.type = dto.type;
    if (dto.difficulty !== undefined) question.difficulty = dto.difficulty;
    if (dto.marksCorrect !== undefined) question.marksCorrect = dto.marksCorrect;
    if (dto.marksWrong !== undefined) question.marksWrong = dto.marksWrong;
    if (dto.integerAnswer !== undefined) question.integerAnswer = dto.integerAnswer;
    if (dto.tags !== undefined) question.tags = dto.tags;

    return this.questionRepo.manager.transaction(async (transactionalEntityManager) => {
      if (dto.options !== undefined) {
        // Delete old options
        await transactionalEntityManager.delete(QuestionOption, { questionId: id });

        // Instantiate new options
        question.options = dto.options.map(opt => this.optionRepo.create({
          questionId: id,
          optionLabel: opt.optionLabel,
          content: opt.content,
          contentImageUrl: opt.contentImageUrl,
          isCorrect: opt.isCorrect,
          sortOrder: opt.sortOrder ?? 0,
        }));
      }

      return transactionalEntityManager.save(question);
    });
  }

  /**
   * Soft delete a question by setting isActive = false
   */
  async deleteQuestion(id: string, tenantId: string): Promise<boolean> {
    const question = await this.questionRepo.findOne({
      where: { id, tenantId, isActive: true },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found or not accessible.`);
    }

    question.isActive = false;
    await this.questionRepo.save(question);
    return true;
  }

  /**
   * Search questions by query string
   */
  async searchQuestions(searchQuery: string, tenantId: string): Promise<Question[]> {
    return this.questionRepo.find({
      where: [
        { tenantId, content: Like(`%${searchQuery}%`), isActive: true },
        { isGlobal: true, content: Like(`%${searchQuery}%`), isActive: true },
      ],
      relations: ['options'],
    });
  }

  /**
   * Get random questions matching criteria
   */
  async getRandomQuestions(filters: QuestionBankQueryDto, count: number, tenantId: string): Promise<Question[]> {
    const { subjectId, chapterId, topicId, difficulty, type } = filters;

    const query = this.questionRepo.createQueryBuilder('question')
      .leftJoinAndSelect('question.options', 'options')
      .where('(question.tenantId = :tenantId OR question.isGlobal = true)', { tenantId })
      .andWhere('question.isActive = :isActive', { isActive: true });

    if (subjectId) {
      query.andWhere('question.subjectId = :subjectId', { subjectId });
    }
    if (chapterId) {
      query.andWhere('question.chapterId = :chapterId', { chapterId });
    }
    if (topicId) {
      query.andWhere('question.topicId = :topicId', { topicId });
    }
    if (difficulty) {
      query.andWhere('question.difficulty = :difficulty', { difficulty });
    }
    if (type) {
      query.andWhere('question.type = :type', { type });
    }

    query.orderBy('RANDOM()');
    query.take(count);

    return query.getMany();
  }
}
