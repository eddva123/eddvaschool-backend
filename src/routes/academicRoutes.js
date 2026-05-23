import express from 'express';
import {
  createClass, listClasses, updateClass, deleteClass,
  createSection, updateSection, deleteSection,
  createSubject, listSubjects, updateSubject, deleteSubject,
} from '../controllers/academicController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

const adminOnly = authorize('INSTITUTE_ADMIN', 'SUPER_ADMIN');
const canReadAcademic = authorize('INSTITUTE_ADMIN', 'SUPER_ADMIN', 'TEACHER');

router.use(protect);

// Read-only for teachers (use in assignments, attendance, etc.)
router.get('/classes', canReadAcademic, listClasses);
router.get('/subjects', canReadAcademic, listSubjects);

// Institute admin (+ super admin) manage classes, sections, subjects
router.post('/classes', adminOnly, createClass);
router.put('/classes/:id', adminOnly, updateClass);
router.delete('/classes/:id', adminOnly, deleteClass);

router.post('/classes/:classId/sections', adminOnly, createSection);
router.put('/sections/:id', adminOnly, updateSection);
router.delete('/sections/:id', adminOnly, deleteSection);

router.post('/subjects', adminOnly, createSubject);
router.put('/subjects/:id', adminOnly, updateSubject);
router.delete('/subjects/:id', adminOnly, deleteSubject);

export default router;
