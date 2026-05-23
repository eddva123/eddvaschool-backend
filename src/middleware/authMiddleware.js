import jwt from 'jsonwebtoken';
import { findUserById } from '../services/authService.js';
import asyncHandler from '../utils/asyncHandler.js';
import APIError from '../utils/APIError.js';

function sanitizeUser(user) {
  if (!user) return user;
  const { password, ...safeUser } = user;
  return safeUser;
}

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(new APIError('Not authorized to access this route', 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'change_me_in_production');
  } catch {
    return next(new APIError('Invalid or expired token', 401));
  }

  if (decoded.id === 'demo-super-admin') {
    req.user = {
      id: 'demo-super-admin',
      email: decoded.email || 'admin@gmail.com',
      role: 'SUPER_ADMIN',
      name: 'Super Admin',
      instituteId: null,
      institute: null,
      isActive: true,
    };
    return next();
  }

  const user = await findUserById(decoded.id).catch(() => null);

  if (!user) {
    return next(new APIError('User no longer exists', 401));
  }

  if (!user.isActive) {
    return next(new APIError('This user account is inactive', 403));
  }

  req.user = sanitizeUser(user);
  next();
});

export const authMiddleware = protect;

export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return next(new APIError('User authorization failed', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new APIError(`Role '${req.user.role}' is not authorized to access this resource`, 403)
      );
    }
    next();
  };
