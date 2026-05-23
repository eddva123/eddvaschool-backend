import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('assignments')
export class Assignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column()
  classId: string;

  @Column()
  subjectId: string;

  @Column({ type: 'date' })
  dueDate: Date;

  @Column({ type: 'int', default: 100 })
  maxMarks: number;

  @Column({ default: 'Active' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
