import express from 'express';
import { listFees, createFee, getFeeAnalytics, recordPayment } from '../controllers/feeController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect, authorize('INSTITUTE_ADMIN'));

router.get('/', listFees);
router.post('/', createFee);
router.get('/analytics', getFeeAnalytics);
router.post('/record', recordPayment);

export default router;
