import express from 'express';
import { createGrievance, getGrievances, updateGrievanceStatus } from '../controllers/grievanceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import validate from '../middleware/validationMiddleware.js';
import { grievanceValidation } from '../validations/grievanceValidation.js';

const router = express.Router();

router.route('/')
    .get(protect, getGrievances)
    .post(protect, grievanceValidation, validate, createGrievance);

router.put('/:id/status', protect, authorize('teacher', 'institute_admin', 'super_admin'), updateGrievanceStatus);

export default router;
