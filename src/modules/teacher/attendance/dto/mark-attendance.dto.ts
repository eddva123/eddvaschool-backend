import { IsEnum, IsOptional, IsString, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
}

export class MarkAttendanceDto {
  @ApiProperty({ description: 'Student UUID', example: 'uuid-v4-string' })
  @IsString()
  studentId: string;

  @ApiProperty({ enum: AttendanceStatus, description: 'Attendance status' })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiPropertyOptional({ description: 'Date in YYYY-MM-DD format', example: '2026-05-25' })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({ description: 'Optional teacher remarks' })
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiPropertyOptional({ description: 'Class or section name' })
  @IsString()
  @IsOptional()
  className?: string;

  @ApiPropertyOptional({ description: 'Student display name (for JSONB snapshot)' })
  @IsString()
  @IsOptional()
  name?: string;
}
