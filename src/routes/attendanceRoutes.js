import express from 'express';
import {
  markAttendance, getAttendance,
  markSessionAttendance, getAttendanceReport, getStudentsByClass,
} from '../controllers/attendanceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import validate from '../middleware/validationMiddleware.js';
import { markAttendanceValidation } from '../validations/attendanceValidation.js';

const router = express.Router();
router.use(protect);

// Student module: Prisma-based attendance
router.get('/', getAttendance);
router.post('/', authorize('INSTITUTE_ADMIN', 'TEACHER'), markAttendance);

// Teacher module: session-based attendance
router.post('/mark', authorize('TEACHER', 'INSTITUTE_ADMIN', 'SUPER_ADMIN'), markAttendanceValidation, validate, markSessionAttendance);
router.get('/report', getAttendanceReport);
router.get('/students/:class_id', getStudentsByClass);

export default router;
