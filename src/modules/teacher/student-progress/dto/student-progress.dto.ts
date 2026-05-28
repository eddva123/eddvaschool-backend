import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';

export enum ProgressTimeframe {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ALL_TIME = 'all_time',
}

export class StudentProgressQueryDto {
  @ApiPropertyOptional({ description: 'Filter by specific class (e.g. 10)' })
  @IsString()
  @IsOptional()
  classId?: string;

  @ApiPropertyOptional({ description: 'Filter by specific batch' })
  @IsString()
  @IsOptional()
  batchId?: string;

  @ApiPropertyOptional({ enum: ProgressTimeframe, default: ProgressTimeframe.MONTHLY })
  @IsEnum(ProgressTimeframe)
  @IsOptional()
  timeframe?: ProgressTimeframe = ProgressTimeframe.MONTHLY;
}

export class StudentRankingQueryDto extends StudentProgressQueryDto {
  @ApiPropertyOptional({ description: 'Subject ID to rank by a specific subject' })
  @IsString()
  @IsOptional()
  subjectId?: string;
}
