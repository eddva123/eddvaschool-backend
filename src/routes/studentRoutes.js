import express from 'express';
import { createStudent, listStudents, getStudent, updateStudent, deleteStudent } from '../controllers/studentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect, authorize('INSTITUTE_ADMIN', 'SUPER_ADMIN'));

router.post('/', createStudent);
router.get('/', listStudents);
router.get('/:id', getStudent);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);

export default router;
