import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('assignments')
export class Assignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ default: 'homework' })
  type: string;

  @Column({ name: 'instructions', type: 'text', nullable: true })
  description: string;

  @Column({ name: 'class_id' })
  classId: string;

  @Column({ name: 'subject_id' })
  subjectId: string;

  @Column({ name: 'due_date', type: 'timestamptz', nullable: true })
  dueDate: Date;

  @Column({ name: 'file_path', nullable: true })
  filePath: string;

  @Column({ default: 'active' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
