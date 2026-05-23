import { body } from 'express-validator';

export const scheduleValidation = [
  body('class_id').isInt().withMessage('Class ID is required'),
  body('subject_id').isInt().withMessage('Subject ID is required'),
  body('teacher_id').isInt().withMessage('Teacher ID is required'),
  body('day_of_week').notEmpty().withMessage('Day of week is required'),
  body('start_time').matches(/^([01]\d|2[0-3]):?([0-5]\d)$/).withMessage('Valid start time (HH:MM) is required'),
  body('end_time').matches(/^([01]\d|2[0-3]):?([0-5]\d)$/).withMessage('Valid end time (HH:MM) is required'),
];
