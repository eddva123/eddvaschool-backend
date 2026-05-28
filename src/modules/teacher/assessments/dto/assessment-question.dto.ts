import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddAssessmentQuestionDto {
  @ApiProperty({ example: 'question-uuid-here', description: 'ID of the question to add' })
  @IsString()
  questionId: string;

  @ApiPropertyOptional({ example: 'section-uuid-here', description: 'ID of the section to assign to' })
  @IsString()
  @IsOptional()
  sectionId?: string;

  @ApiPropertyOptional({ example: 1, description: 'Display or sequence order' })
  @IsNumber()
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ example: 4, description: 'Overridden positive marks for this question' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  marksCorrect?: number;

  @ApiPropertyOptional({ example: -1, description: 'Overridden negative marks for this question' })
  @IsNumber()
  @IsOptional()
  marksWrong?: number;
}

export class QuestionAttemptAnswerDto {
  @ApiProperty({ example: 'question-uuid-here' })
  @IsString()
  questionId: string;

  @ApiPropertyOptional({ example: ['option-uuid-1'], description: 'For MCQ single/multi options selected' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  selectedOptionIds?: string[];

  @ApiPropertyOptional({ example: '42', description: 'For Integer type questions' })
  @IsString()
  @IsOptional()
  integerAnswer?: string;

  @ApiPropertyOptional({ example: 'Detailed explanatory response', description: 'For Descriptive type questions' })
  @IsString()
  @IsOptional()
  descriptiveAnswer?: string;

  @ApiPropertyOptional({ example: 35, description: 'Time spent in seconds on this question' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  timeSpentSeconds?: number;
}

export class SubmitAttemptDto {
  @ApiProperty({ example: 'attempt-uuid-here' })
  @IsString()
  attemptId: string;

  @ApiProperty({ type: [QuestionAttemptAnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionAttemptAnswerDto)
  answers: QuestionAttemptAnswerDto[];
}
