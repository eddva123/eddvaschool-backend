import { IsOptional, IsString, IsNumberString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AnnouncementQueryDto {
  @ApiPropertyOptional({ example: '1', description: 'Page number' })
  @IsNumberString()
  @IsOptional()
  page?: string;

  @ApiPropertyOptional({ example: '10', description: 'Limit items per page' })
  @IsNumberString()
  @IsOptional()
  limit?: string;

  @ApiPropertyOptional({ example: '10', description: 'Alternate limit parameter' })
  @IsNumberString()
  @IsOptional()
  perPage?: string;

  @ApiPropertyOptional({ example: 'HIGH', description: 'Filter by priority (HIGH, NORMAL, LOW)' })
  @IsString()
  @IsOptional()
  priority?: string;
}
