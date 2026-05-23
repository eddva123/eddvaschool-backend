import express from 'express';
import { createSchedule, getSchedules, getRecordings } from '../controllers/classController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import validate from '../middleware/validationMiddleware.js';
import { scheduleValidation } from '../validations/classValidation.js';

const router = express.Router();

router.route('/schedules')
    .get(protect, getSchedules)
    .post(
        protect,
        scheduleValidation,
        validate,
        createSchedule
        );

router.get('/recordings', protect, getRecordings);
export default router;
