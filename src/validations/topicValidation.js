import { body } from 'express-validator';

export const topicValidation = [
  body('name').trim().notEmpty().withMessage('Topic name is required'),
  body('subject_id').isInt().withMessage('Valid subject ID is required'),
];

export const chapterValidation = [
  body('name').trim().notEmpty().withMessage('Chapter name is required'),
  body('order').isInt({ min: 1 }).withMessage('Order must be a positive integer'),
];
