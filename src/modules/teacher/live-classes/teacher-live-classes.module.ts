import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeacherDataStore } from '../../../database/entities/teacher-data-store.entity';
import { TeacherDataStoreService } from '../../compat/teacher-datastore.service';
import { TeacherLiveClassesService } from './teacher-live-classes.service';

@Module({
  imports: [TypeOrmModule.forFeature([TeacherDataStore])],
  providers: [TeacherLiveClassesService, TeacherDataStoreService],
  exports: [TeacherLiveClassesService],
})
export class TeacherLiveClassesModule {}
