import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceSession, AttendanceRecord } from '../../../database/entities/attendance.entity';
import { Student } from '../../../database/entities/student.entity';
import { TeacherDataStore } from '../../../database/entities/teacher-data-store.entity';
import { TeacherAttendanceController } from './teacher-attendance.controller';
import { TeacherAttendanceService } from './teacher-attendance.service';
import { TeacherDataStoreService } from '../../compat/teacher-datastore.service';
import { TeacherCacheModule } from '../common/teacher-cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AttendanceSession, AttendanceRecord, Student, TeacherDataStore]),
    TeacherCacheModule,
  ],
  controllers: [TeacherAttendanceController],
  providers: [TeacherAttendanceService, TeacherDataStoreService],
  exports: [TeacherAttendanceService],
})
export class TeacherAttendanceModule {}
