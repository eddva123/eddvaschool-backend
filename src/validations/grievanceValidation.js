import { body } from 'express-validator';

export const grievanceValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('description').notEmpty().withMessage('Description is required'),
];
