import { Module } from '@nestjs/common';
import { TeacherCacheService } from './teacher-cache.service';

@Module({
  providers: [TeacherCacheService],
  exports: [TeacherCacheService],
})
export class TeacherCacheModule {}
