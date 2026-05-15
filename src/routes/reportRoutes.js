import express from 'express';
import { getStudentReport, getClassReport } from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/student/:id', protect, getStudentReport);
router.get('/class/:classId', protect, authorize('teacher', 'institute_admin', 'super_admin'), getClassReport);

export default router;
