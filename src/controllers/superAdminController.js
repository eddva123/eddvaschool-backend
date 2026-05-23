import asyncHandler from '../utils/asyncHandler.js';
import APIError from '../utils/APIError.js';
import * as superAdmin from '../services/superAdminService.js';

export const onboardTeacher = asyncHandler(async (req, res) => {
  const result = await superAdmin.onboardTeacher(req.body);
  res.status(201).json({ success: true, message: 'Teacher onboarded successfully', data: result });
});

export const onboardStudent = asyncHandler(async (req, res) => {
  const result = await superAdmin.onboardStudent(req.body);
  res.status(201).json({ success: true, message: 'Student onboarded successfully', data: result });
});

export const getCurriculum = asyncHandler(async (req, res) => {
  const instituteId = req.query.instituteId || req.body?.instituteId;
  const data = await superAdmin.getCurriculum(instituteId);
  res.json({ success: true, data });
});

export const createClass = asyncHandler(async (req, res) => {
  const data = await superAdmin.createClass(req.body);
  res.status(201).json({ success: true, data });
});

export const createSubject = asyncHandler(async (req, res) => {
  const data = await superAdmin.createSubject(req.body);
  res.status(201).json({ success: true, data });
});

export const createTopic = asyncHandler(async (req, res) => {
  const data = await superAdmin.createTopic(req.body);
  res.status(201).json({ success: true, data });
});

export const addChapter = asyncHandler(async (req, res, next) => {
  const { name, order } = req.body;
  if (!name) return next(new APIError('Chapter name is required', 400));
  const data = await superAdmin.addChapter(req.params.topicId, { name, order });
  res.status(201).json({ success: true, data });
});

export const listTeachers = asyncHandler(async (req, res) => {
  const { query } = await import('../config/db.js');
  const instituteId = req.query.instituteId;
  let sql = `
    SELECT u.id, u.name, u.email, u.phone, u.is_active, u.created_at,
           t.id AS teacher_profile_id, t.employee_id, t.department
    FROM users u
    JOIN teachers t ON t.user_id = u.id
    WHERE u.role = 'TEACHER'`;
  const params = [];
  if (instituteId) {
    sql += ` AND u.institute_id = $1`;
    params.push(instituteId);
  }
  sql += ` ORDER BY u.name`;
  const result = await query(sql, params);
  res.json({ success: true, count: result.rows.length, data: result.rows });
});

export const listStudents = asyncHandler(async (req, res) => {
  const { query } = await import('../config/db.js');
  const instituteId = req.query.instituteId;
  let sql = `
    SELECT u.id, u.name, u.email, u.phone, u.is_active,
           s.id AS student_profile_id, s.enrollment_no, s.roll_no, s.section_id,
           sec.name AS section_name, c.name AS class_name
    FROM users u
    JOIN students s ON s.user_id = u.id
    LEFT JOIN sections sec ON s.section_id = sec.id
    LEFT JOIN classes c ON sec.class_id = c.id
    WHERE u.role = 'STUDENT'`;
  const params = [];
  if (instituteId) {
    sql += ` AND u.institute_id = $1`;
    params.push(instituteId);
  }
  sql += ` ORDER BY u.name`;
  const result = await query(sql, params);
  res.json({ success: true, count: result.rows.length, data: result.rows });
});
