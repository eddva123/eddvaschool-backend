import express from 'express';
import { loginHandler, registerHandler, registerUserHandler, getMe, logout } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', loginHandler);
router.post('/register', registerHandler);
router.post('/register-user', registerUserHandler);
router.get('/me', protect, getMe);
router.get('/logout', logout);

export default router;
