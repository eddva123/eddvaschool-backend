import { body } from 'express-validator';

export const assessmentValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('type').notEmpty().withMessage('Type is required'),
  body('subject_id').isInt().withMessage('Subject ID is required'),
  body('class_id').isInt().withMessage('Class ID is required'),
  body('total_marks').isInt({ min: 1 }).withMessage('Total marks must be at least 1'),
  body('scheduled_date').isISO8601().withMessage('Valid scheduled date is required'),
];

export const resultValidation = [
  body('assessment_id').isInt().withMessage('Assessment ID is required'),
  body('student_id').isInt().withMessage('Student ID is required'),
  body('marks_obtained').isInt({ min: 0 }).withMessage('Marks obtained must be at least 0'),
];
