import express from 'express';

import { getSubjects } from '../controllers/subjectController.js';

import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// =======================================
// GET SUBJECTS
// =======================================
router.get(
  '/',
  protect,
  getSubjects
);

export default router;