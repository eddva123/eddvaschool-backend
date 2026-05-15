import express from 'express';

import {
  createAssessment,
  getAssessments,
  submitResult,
  getLeaderboard,
  getAssessmentAnalytics,
  updateAssessment,
  deleteAssessment
} from '../controllers/assessmentController.js';

import {
  protect,
  authorize
} from '../middleware/authMiddleware.js';

import validate from '../middleware/validationMiddleware.js';

import {
  assessmentValidation,
  resultValidation
} from '../validations/assessmentValidation.js';

const router = express.Router();

// ======================================
// ASSESSMENTS
// ======================================

router
  .route('/')
  .get(
    protect,
    getAssessments
  )
  .post(
    protect,
    authorize(
      'teacher',
      'institute_admin',
      'super_admin'
    ),
    assessmentValidation,
    validate,
    createAssessment
  );

router.put(
  '/:id',
  protect,
  authorize(
    'teacher',
    'institute_admin',
    'super_admin'
  ),
  assessmentValidation,
  validate,
  updateAssessment
);

router.delete(
  '/:id',
  protect,
  authorize(
    'teacher',
    'institute_admin',
    'super_admin'
  ),
  deleteAssessment
);
// ======================================
// RESULTS
// ======================================

router.post(
  '/results',
  protect,
  authorize(
    'teacher',
    'institute_admin',
    'super_admin'
  ),
  resultValidation,
  validate,
  submitResult
);

// ======================================
// LEADERBOARD
// ======================================

router.get(
  '/:id/leaderboard',
  protect,
  getLeaderboard
);

// ======================================
// ANALYTICS
// ======================================

router.get(
  '/:id/analytics',
  protect,
  getAssessmentAnalytics
);

export default router;