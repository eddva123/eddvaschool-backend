import express from 'express';
import { getMyRooms, getMessages } from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/rooms', getMyRooms);
router.get('/rooms/:roomId/messages', getMessages);

export default router;
