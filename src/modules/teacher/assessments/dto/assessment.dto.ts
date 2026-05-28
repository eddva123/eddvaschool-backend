import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AssessmentType {
  QUIZ = 'quiz',
  EXAM = 'exam',
  TEST = 'test',
  ASSIGNMENT = 'assignment',
}

export class CreateAssessmentDto {
  @ApiProperty({ example: 'Unit 3 Quiz', description: 'Assessment title' })
  @IsString()
  title: string;

  @ApiProperty({ enum: AssessmentType, default: AssessmentType.QUIZ })
  @IsEnum(AssessmentType)
  type: AssessmentType;

  @ApiProperty({ example: 100, minimum: 1 })
  @IsNumber()
  @Min(1)
  totalMarks: number;

  @ApiPropertyOptional({ example: 'Covers chapters 7–9' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateAssessmentSectionDto {
  @ApiProperty({ example: 'Section A – MCQs' })
  @IsString()
  title: string;

  @ApiProperty({ example: 1, minimum: 0 })
  @IsNumber()
  @Min(0)
  order: number;
}

export class RecordResultDto {
  @ApiProperty({ example: 'student-uuid', description: 'Student ID' })
  @IsString()
  studentId: string;

  @ApiProperty({ example: 78, minimum: 0 })
  @IsNumber()
  @Min(0)
  score: number;

  @ApiPropertyOptional({ example: 78.5, description: 'Score percentage' })
  @IsNumber()
  @IsOptional()
  percentage?: number;

  @ApiPropertyOptional({ example: 'Good understanding of core concepts' })
  @IsString()
  @IsOptional()
  remarks?: string;
}
