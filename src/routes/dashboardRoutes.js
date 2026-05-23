import express from 'express';
import { stats } from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats', protect, stats);

export default router;
