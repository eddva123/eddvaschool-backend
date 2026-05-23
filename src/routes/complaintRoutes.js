import express from 'express';
import { createComplaint, listComplaints, updateComplaint } from '../controllers/complaintController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/', listComplaints);
router.post('/', createComplaint);
router.put('/:id', updateComplaint);

export default router;
