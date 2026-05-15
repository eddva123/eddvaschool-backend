import { body } from 'express-validator';

export const markAttendanceValidation = [
  body('schedule_id').isInt().withMessage('Schedule ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('students').isArray({ min: 1 }).withMessage('Students list is required'),
  body('students.*.student_id').isInt().withMessage('Valid student ID is required'),
  body('students.*.status').isIn(['present', 'absent', 'late']).withMessage('Invalid attendance status'),
];
