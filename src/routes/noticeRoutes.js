import express from 'express';
import { createNotice, listNotices, updateNotice, deleteNotice } from '../controllers/noticeController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/', listNotices);
router.post('/', authorize('INSTITUTE_ADMIN'), createNotice);
router.put('/:id', authorize('INSTITUTE_ADMIN'), updateNotice);
router.delete('/:id', authorize('INSTITUTE_ADMIN'), deleteNotice);

export default router;
