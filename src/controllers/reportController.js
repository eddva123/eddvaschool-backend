import asyncHandler from '../utils/asyncHandler.js';
import { getStudentPerformance, getClassAnalytics } from '../services/analyticsService.js';

export const getStudentReport = asyncHandler(async (req, res, next) => {
  const studentId = req.params.id || req.user.id;
  const data = await getStudentPerformance(studentId);
  res.status(200).json({ success: true, data });
});

export const getClassReport = asyncHandler(async (req, res, next) => {
  const { classId } = req.params;
  const data = await getClassAnalytics(classId);
  res.status(200).json({ success: true, data });
});
