import express from 'express';
import upload from '../middleware/uploadMiddleware.js';

import {
  getPresentations,
  createPresentation,
  getMindMaps,
  createMindMap,
} from '../controllers/creatorStudioController.js';

import {
  protect,
} from '../middleware/authMiddleware.js';

const router = express.Router();

  router
  .route('/mind-maps')

  .get(
    protect,
    getMindMaps
  )

  .post(
    protect,
    createMindMap
  );

  router
  .route('/presentations')

  .get(
    protect,
    getPresentations
  )

  .post(
    protect,
    upload.single('pptFile'),
    createPresentation
  );
  
export default router;