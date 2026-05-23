import express from 'express';
import { listActivityLogs, createActivityLog } from '../controllers/activityLogController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, authorize('SUPER_ADMIN', 'INSTITUTE_ADMIN'), listActivityLogs);
router.post('/', protect, createActivityLog);

export default router;
