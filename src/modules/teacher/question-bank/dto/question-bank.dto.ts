import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuestionType, DifficultyLevel, QuestionSource } from '../../../../database/entities/question.entity';

export class CreateQuestionOptionDto {
  @ApiProperty({ example: 'A', description: 'Option label (e.g. A, B, C, D)' })
  @IsString()
  optionLabel: string;

  @ApiProperty({ example: 'The value is 42' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.png' })
  @IsString()
  @IsOptional()
  contentImageUrl?: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  isCorrect: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class CreateQuestionDto {
  @ApiPropertyOptional({ example: 'subject-uuid' })
  @IsString()
  @IsOptional()
  subjectId?: string;

  @ApiPropertyOptional({ example: 'chapter-uuid' })
  @IsString()
  @IsOptional()
  chapterId?: string;

  @ApiPropertyOptional({ example: 'topic-uuid' })
  @IsString()
  @IsOptional()
  topicId?: string;

  @ApiProperty({ example: 'What is the sum of 2 and 2?' })
  @IsString()
  @MinLength(3)
  content: string;

  @ApiPropertyOptional({ example: 'https://example.com/question.png' })
  @IsString()
  @IsOptional()
  contentImageUrl?: string;

  @ApiPropertyOptional({ example: 'The solution is 4 because 2 + 2 = 4.' })
  @IsString()
  @IsOptional()
  solutionText?: string;

  @ApiPropertyOptional({ example: 'https://youtube.com/watch?v=123' })
  @IsString()
  @IsOptional()
  solutionVideoUrl?: string;

  @ApiProperty({ enum: QuestionType, default: QuestionType.MCQ_SINGLE })
  @IsEnum(QuestionType)
  type: QuestionType;

  @ApiProperty({ enum: DifficultyLevel, default: DifficultyLevel.MEDIUM })
  @IsEnum(DifficultyLevel)
  difficulty: DifficultyLevel;

  @ApiPropertyOptional({ example: 4, default: 4 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  marksCorrect?: number;

  @ApiPropertyOptional({ example: -1, default: -1 })
  @IsNumber()
  @IsOptional()
  marksWrong?: number;

  @ApiPropertyOptional({ example: '42' })
  @IsString()
  @IsOptional()
  integerAnswer?: string;

  @ApiPropertyOptional({ example: ['algebra', 'basics'], default: [] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ type: [CreateQuestionOptionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionOptionDto)
  @IsOptional()
  options?: CreateQuestionOptionDto[];
}

export class UpdateQuestionDto {
  @ApiPropertyOptional({ example: 'subject-uuid' })
  @IsString()
  @IsOptional()
  subjectId?: string;

  @ApiPropertyOptional({ example: 'chapter-uuid' })
  @IsString()
  @IsOptional()
  chapterId?: string;

  @ApiPropertyOptional({ example: 'topic-uuid' })
  @IsString()
  @IsOptional()
  topicId?: string;

  @ApiPropertyOptional({ example: 'Updated question content?' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ example: 'https://example.com/question.png' })
  @IsString()
  @IsOptional()
  contentImageUrl?: string;

  @ApiPropertyOptional({ example: 'Updated solution' })
  @IsString()
  @IsOptional()
  solutionText?: string;

  @ApiPropertyOptional({ example: 'https://youtube.com/watch?v=123' })
  @IsString()
  @IsOptional()
  solutionVideoUrl?: string;

  @ApiPropertyOptional({ enum: QuestionType })
  @IsEnum(QuestionType)
  @IsOptional()
  type?: QuestionType;

  @ApiPropertyOptional({ enum: DifficultyLevel })
  @IsEnum(DifficultyLevel)
  @IsOptional()
  difficulty?: DifficultyLevel;

  @ApiPropertyOptional({ example: 4 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  marksCorrect?: number;

  @ApiPropertyOptional({ example: -1 })
  @IsNumber()
  @IsOptional()
  marksWrong?: number;

  @ApiPropertyOptional({ example: '42' })
  @IsString()
  @IsOptional()
  integerAnswer?: string;

  @ApiPropertyOptional({ example: ['algebra', 'basics'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ type: [CreateQuestionOptionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionOptionDto)
  @IsOptional()
  options?: CreateQuestionOptionDto[];
}

export class QuestionBankQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  subjectId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  chapterId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  topicId?: string;

  @ApiPropertyOptional({ enum: DifficultyLevel })
  @IsEnum(DifficultyLevel)
  @IsOptional()
  difficulty?: DifficultyLevel;

  @ApiPropertyOptional({ enum: QuestionType })
  @IsEnum(QuestionType)
  @IsOptional()
  type?: QuestionType;

  @ApiPropertyOptional({ enum: QuestionSource })
  @IsEnum(QuestionSource)
  @IsOptional()
  source?: QuestionSource;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;
}
