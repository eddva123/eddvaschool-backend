import express from 'express';
import { createTimetable, getTimetable, updateTimetable, deleteTimetable } from '../controllers/timetableController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/', getTimetable);
router.post('/', authorize('INSTITUTE_ADMIN'), createTimetable);
router.put('/:id', authorize('INSTITUTE_ADMIN'), updateTimetable);
router.delete('/:id', authorize('INSTITUTE_ADMIN'), deleteTimetable);

export default router;
