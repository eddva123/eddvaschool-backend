import express from 'express';
import { createEvent, listEvents, deleteEvent } from '../controllers/eventController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/', listEvents);
router.post('/', authorize('INSTITUTE_ADMIN'), createEvent);
router.delete('/:id', authorize('INSTITUTE_ADMIN'), deleteEvent);

export default router;
