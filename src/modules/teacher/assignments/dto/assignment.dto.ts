import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  MinLength,
  Min,
  Max,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AssignmentType {
  HOMEWORK = 'homework',
  PROJECT = 'project',
  QUIZ = 'quiz',
  CLASSWORK = 'classwork',
}

export class CreateAssignmentDto {
  @ApiProperty({ example: 'Chapter 5 Homework', minLength: 3 })
  @IsString()
  @MinLength(3)
  title: string;

  @ApiPropertyOptional({ example: '2026-06-01T10:00:00Z', description: 'Schedule publish date' })
  @IsDateString()
  @IsOptional()
  publishAt?: string;

  @ApiPropertyOptional({ example: true, description: 'Allow resubmission' })
  @IsOptional()
  allowResubmission?: boolean;

  @ApiPropertyOptional({ example: 3, description: 'Max attempts' })
  @IsNumber()
  @IsOptional()
  maxAttempts?: number;

  @ApiPropertyOptional({ example: true, description: 'Enable rubric grading' })
  @IsOptional()
  rubricEnabled?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Allow late submission' })
  @IsOptional()
  lateSubmissionAllowed?: boolean;

  @ApiPropertyOptional({ example: 10, description: 'Late penalty percentage' })
  @IsNumber()
  @IsOptional()
  latePenaltyPercentage?: number;

  @ApiProperty({ enum: AssignmentType, default: AssignmentType.HOMEWORK })
  @IsEnum(AssignmentType)
  type: AssignmentType;

  @ApiProperty({ example: 'class-uuid-here', description: 'Class ID' })
  @IsString()
  class_id: string;

  @ApiPropertyOptional({ example: 'subject-uuid-here' })
  @IsString()
  @IsOptional()
  subject_id?: string;

  @ApiPropertyOptional({ example: '2026-06-01', description: 'Due date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  due_date?: string;

  @ApiPropertyOptional({ example: 'Complete exercises 1–10' })
  @IsString()
  @IsOptional()
  instructions?: string;

  @ApiPropertyOptional({ example: 'Additional description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 100, minimum: 1, maximum: 1000 })
  @IsNumber()
  @Min(1)
  @Max(1000)
  @IsOptional()
  max_marks?: number;

  @ApiPropertyOptional({ example: 'class-name-string' })
  @IsString()
  @IsOptional()
  class_name?: string;

  @ApiPropertyOptional({ example: 'subject-name-string' })
  @IsString()
  @IsOptional()
  subject_name?: string;
}

export class GradeSubmissionDto {
  @ApiProperty({ example: 85, description: 'Score achieved', minimum: 0 })
  @IsNumber()
  @Min(0)
  score: number;

  @ApiPropertyOptional({ example: 'A', description: 'Letter grade' })
  @IsString()
  @IsOptional()
  grade?: string;

  @ApiPropertyOptional({ example: 'Good effort, review section 3' })
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiPropertyOptional({ example: { "Accuracy": 10, "Presentation": 8 }, description: 'Rubric score breakdown' })
  @IsOptional()
  rubricBreakdown?: Record<string, number>;

  @ApiPropertyOptional({ example: 'Overall good, but some parts are missing.', description: 'Feedback summary' })
  @IsString()
  @IsOptional()
  feedbackSummary?: string;
}

export class UpdateAssignmentStatusDto {
  @ApiProperty({ example: 'PUBLISHED' })
  @IsString()
  status: string;
}

export class ScheduleAssignmentDto {
  @ApiProperty({ example: '2026-06-01T10:00:00Z' })
  @IsDateString()
  publishAt: string;
}

export class RubricCriterionDto {
  @ApiProperty({ example: 'Accuracy' })
  @IsString()
  criterion: string;

  @ApiPropertyOptional({ example: 10 })
  @IsNumber()
  @IsOptional()
  maxScore?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsNumber()
  @IsOptional()
  weight?: number;

  @ApiPropertyOptional({ example: 'How accurate the solution is' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class SetRubricDto {
  @ApiProperty({ type: [RubricCriterionDto] })
  @IsOptional()
  criteria: RubricCriterionDto[];
}

export class SubmitAssignmentDto {
  @ApiPropertyOptional({ example: 'https://s3.amazonaws.com/bucket/submission.pdf' })
  @IsUrl()
  @IsOptional()
  attachmentUrl?: string;

  @ApiPropertyOptional({ example: 'Here is my homework submit' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: 'student-uuid-here' })
  @IsString()
  @IsOptional()
  studentId?: string;
}
