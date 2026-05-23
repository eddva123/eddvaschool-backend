import express from 'express';
import { createTeacher, listTeachers, getTeacher, updateTeacher, deleteTeacher } from '../controllers/teacherController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect, authorize('INSTITUTE_ADMIN', 'SUPER_ADMIN'));

router.post('/', createTeacher);
router.get('/', listTeachers);
router.get('/:id', getTeacher);
router.put('/:id', updateTeacher);
router.delete('/:id', deleteTeacher);

export default router;
