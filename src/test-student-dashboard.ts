import 'reflect-metadata';
import './bootstrap-env';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { StudentService } from './modules/student/student.service';
import { Student } from './database/entities/student.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

async function run() {
  console.log('Bootstrapping NestJS application...');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  console.log('App context initialized.');

  const studentService = app.get(StudentService);
  const studentRepo = app.get<Repository<Student>>(getRepositoryToken(Student));

  // Find a student
  const student = await studentRepo.findOne({ relations: ['user'] });
  if (!student) {
    console.error('No student found in the database!');
    await app.close();
    return;
  }

  console.log(`Found student: ID=${student.id}, UserID=${student.userId}, ExamTarget=${student.examTarget}`);

  try {
    console.log('Calling getDashboard...');
    const result = await studentService.getDashboard(student.userId, student.tenantId);
    console.log('getDashboard succeeded! Keys in result:', Object.keys(result));
  } catch (err: any) {
    console.error('getDashboard failed with error:');
    console.error(err);
    if (err.stack) {
      console.error(err.stack);
    }
  }

  await app.close();
}

run().catch((err) => {
  console.error('Script failed:', err);
});
