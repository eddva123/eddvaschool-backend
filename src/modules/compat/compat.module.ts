import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Announcement } from '../../database/entities/announcement.entity';
import { Enrollment } from '../../database/entities/batch.entity';
import { Student } from '../../database/entities/student.entity';
import { Tenant } from '../../database/entities/tenant.entity';
import { TeacherProfile } from '../../database/entities/teacher.entity';
import { User } from '../../database/entities/user.entity';
import { Complaint } from '../../database/entities/complaint.entity';
import { CompatController } from './compat.controller';
import { CompatService } from './compat.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, User, Announcement, Enrollment, Student, TeacherProfile, Complaint])],
  controllers: [CompatController],
  providers: [CompatService],
})
export class CompatModule {}