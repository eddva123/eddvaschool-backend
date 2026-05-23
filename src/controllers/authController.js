import jwt from 'jsonwebtoken';
import { login, register, registerUser, sanitizeUser } from '../services/authService.js';
import { jwtSecret, jwtExpiresIn } from '../config/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import APIError from '../utils/APIError.js';

function setCookieToken(res, token) {
  res.cookie('token', token, {
    expires: new Date(
      Date.now() + Number(process.env.COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
}

// ======================================
// POST /api/v1/auth/login
// Multi-tenant login (student/admin portal)
// Also accepts simple email+password for teacher portal
// ======================================
export const loginHandler = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new APIError('Email and password are required', 400));
  }

  const data = await login({ email, password, tenantDomain: req.tenantDomain });
  setCookieToken(res, data.token);

  res.json({
    success: true,
    message: 'Login successful',
    token: data.token,
    user: data.user,
    institute: data.institute,
    tenantDomain: data.tenantDomain,
    tenantUrl: data.tenantUrl,
    data: data.user,
  });
});

// ======================================
// POST /api/v1/auth/register (institute registration)
// ======================================
export const registerHandler = asyncHandler(async (req, res, next) => {
  const data = await register(req.body);
  res.status(201).json({ success: true, ...data });
});

// ======================================
// POST /api/v1/auth/register-user (simple user registration for teacher portal)
// ======================================
export const registerUserHandler = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return next(new APIError('Name, email and password are required', 400));
  }

  const user = await registerUser({ name, email, password, role });
  const token = jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    jwtSecret,
    { expiresIn: jwtExpiresIn }
  );

  setCookieToken(res, token);
  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    token,
    data: user,
  });
});

// ======================================
// GET /api/v1/auth/me
// ======================================
export const getMe = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: 'User fetched successfully',
    data: req.user,
  });
});

// ======================================
// GET /api/v1/auth/logout
// ======================================
export const logout = asyncHandler(async (req, res, next) => {
  res
    .status(200)
    .cookie('token', '', {
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    })
    .json({ success: true, message: 'Logged out successfully' });
});
