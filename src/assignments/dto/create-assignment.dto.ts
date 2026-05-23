import { IsString, IsNotEmpty, IsOptional, IsInt, IsDateString } from 'class-validator';

export class CreateAssignmentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  classId: string;

  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @IsInt()
  @IsOptional()
  maxMarks?: number;

  @IsString()
  @IsOptional()
  status?: string;
}
