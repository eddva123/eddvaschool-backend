import express from 'express';

import {
  uploadMaterial,
  getMaterials,
} from '../controllers/materialController.js';

import {
  protect,
} from '../middleware/authMiddleware.js';

import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// ======================================
// UPLOAD
// ======================================
router.post(
  '/',
  protect,
  upload.single('file'),
  uploadMaterial
);

// ======================================
// GET MATERIALS
// ======================================
router.get(
  '/:chapterId',
  protect,
  getMaterials
);

export default router;