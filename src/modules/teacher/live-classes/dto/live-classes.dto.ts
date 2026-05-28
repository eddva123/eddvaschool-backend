import { IsEnum, IsOptional, IsString, IsNumber, Min, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DayOfWeek {
  MONDAY = 'Monday',
  TUESDAY = 'Tuesday',
  WEDNESDAY = 'Wednesday',
  THURSDAY = 'Thursday',
  FRIDAY = 'Friday',
  SATURDAY = 'Saturday',
  SUNDAY = 'Sunday',
}

export enum ScheduleType {
  ONLINE = 'online',
  OFFLINE = 'offline',
  HYBRID = 'hybrid',
}

export class CreateScheduleDto {
  @ApiProperty({ enum: DayOfWeek, example: DayOfWeek.MONDAY })
  @IsEnum(DayOfWeek)
  day_of_week: DayOfWeek;

  @ApiProperty({ example: '09:00', description: 'Start time HH:MM' })
  @IsString()
  start_time: string;

  @ApiProperty({ example: '10:30', description: 'End time HH:MM' })
  @IsString()
  end_time: string;

  @ApiProperty({ enum: ScheduleType, default: ScheduleType.ONLINE })
  @IsEnum(ScheduleType)
  type: ScheduleType;

  @ApiPropertyOptional({ example: 'https://zoom.us/j/xxxxx' })
  @IsUrl()
  @IsOptional()
  zoom_link?: string;

  @ApiPropertyOptional({ example: 'https://meet.google.com/xxx-xxx' })
  @IsUrl()
  @IsOptional()
  google_meet_link?: string;

  @ApiPropertyOptional({ example: 'subject-uuid' })
  @IsString()
  @IsOptional()
  subject_id?: string;

  @ApiPropertyOptional({ example: 'class-uuid' })
  @IsString()
  @IsOptional()
  class_id?: string;
}

export enum EventCategory {
  ACADEMIC = 'ACADEMIC',
  EXAM = 'EXAM',
  HOLIDAY = 'HOLIDAY',
  SPORTS = 'SPORTS',
  CULTURAL = 'CULTURAL',
  MEETING = 'MEETING',
}

export enum EventPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export class CreateEventDto {
  @ApiProperty({ example: 'Annual Sports Day' })
  @IsString()
  title: string;

  @ApiProperty({ example: '2026-06-01T09:00:00Z' })
  @IsString()
  startTime: string;

  @ApiPropertyOptional({ example: '2026-06-01T17:00:00Z' })
  @IsString()
  @IsOptional()
  endTime?: string;

  @ApiProperty({ enum: EventCategory, default: EventCategory.ACADEMIC })
  @IsEnum(EventCategory)
  category: EventCategory;

  @ApiPropertyOptional({ example: 'Annual sports event for all students' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'School Ground' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ enum: EventPriority, default: EventPriority.NORMAL })
  @IsEnum(EventPriority)
  @IsOptional()
  priority?: EventPriority;
}
