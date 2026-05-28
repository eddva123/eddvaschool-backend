import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeacherDataStore } from '../../../database/entities/teacher-data-store.entity';
import { TeacherDataStoreService } from '../../compat/teacher-datastore.service';
import { TeacherCreatorStudioService } from './teacher-creator-studio.service';

@Module({
  imports: [TypeOrmModule.forFeature([TeacherDataStore])],
  providers: [TeacherCreatorStudioService, TeacherDataStoreService],
  exports: [TeacherCreatorStudioService],
})
export class TeacherCreatorStudioModule {}
