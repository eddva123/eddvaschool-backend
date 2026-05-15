import express from 'express';
import { getTopics, createTopic, getTopicWithChapters, addChapter } from '../controllers/topicController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

const curriculumAdmin = authorize('INSTITUTE_ADMIN', 'SUPER_ADMIN');
const canViewTopics = authorize('INSTITUTE_ADMIN', 'SUPER_ADMIN', 'TEACHER');

// View curriculum (teachers read-only; structure set by institute admin)
router.get('/', protect, canViewTopics, getTopics);
router.get('/:id', protect, canViewTopics, getTopicWithChapters);

// Create / extend curriculum — institute admin & super admin only
router.post('/', protect, curriculumAdmin, createTopic);
router.post('/:id/chapters', protect, curriculumAdmin, addChapter);

export default router;
