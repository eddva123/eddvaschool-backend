import express from 'express';
import { getMyNotifications, markAsRead } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getMyNotifications);
router.put('/:id/read', markAsRead);

export default router;
