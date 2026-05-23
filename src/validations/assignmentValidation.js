import { body } from 'express-validator';

export const createAssignmentValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('type').isIn(['homework', 'dpp', 'notes']).withMessage('Invalid assignment type'),
  body('subject_id').isInt().withMessage('Subject ID is required'),
  body('class_id').isInt().withMessage('Class ID is required'),
  body('due_date').optional().isISO8601().toDate().withMessage('Invalid due date'),
  body('instructions').optional().trim().isString().withMessage('Instructions must be a string'),
];

export const submitAssignmentValidation = [
  body('assignment_id').isInt().withMessage('Assignment ID is required'),
];
