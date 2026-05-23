import express from 'express';

import {
  createAssignment,
  getAssignments,
  deleteAssignment
} from '../controllers/assignmentController.js';

import {
  createAssignmentValidation
} from '../validations/assignmentValidation.js';

import { protect, authorize } from '../middleware/authMiddleware.js';

import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router
  .route('/')
  .get(protect, getAssignments)
  .post(
    protect,
    authorize('teacher', 'institute_admin', 'super_admin'),
    upload.single('file'),
    createAssignmentValidation,
    createAssignment
  );

  router.delete(
  '/:id',
  protect,
  authorize(
    'teacher',
    'institute_admin',
    'super_admin'
  ),
  deleteAssignment
);
export default router;