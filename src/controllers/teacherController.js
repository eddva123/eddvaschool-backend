import { query } from '../config/db.js';
import bcrypt from 'bcryptjs';
import { rowToCamel } from '../utils/dbRow.js';
import { resolveInstituteId } from '../utils/instituteScope.js';

function normalizeTeacherBody(body) {
  const qualifications =
    body.qualifications ||
    [body.qualification, body.degree, body.specialization].filter(Boolean).join(' | ') ||
    null;

  return {
    name: body.name?.trim(),
    email: body.email?.trim().toLowerCase(),
    password: body.password,
    phone: body.phone || null,
    photo: body.photo || null,
    employeeId: body.employeeId || body.employeeCode || null,
    department: body.department || null,
    joiningDate: body.joiningDate || body.joinDate || null,
    qualifications,
    subjectIds: Array.isArray(body.subjectIds) ? body.subjectIds : [],
  };
}

export const createTeacher = async (req, res, next) => {
  try {
    const instituteId = await resolveInstituteId(req.user, req.body.instituteId);
    const data = normalizeTeacherBody(req.body);

    if (!data.name || !data.email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    if (!data.password) {
      return res.status(400).json({ error: 'Password is required for teacher login' });
    }

    const existing = await query(`SELECT id FROM users WHERE LOWER(email) = LOWER($1)`, [data.email]);
    if (existing.rows.length) return res.status(400).json({ error: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const userResult = await query(
      `INSERT INTO users (institute_id, name, email, password, role, photo, phone, is_active)
       VALUES ($1, $2, $3, $4, 'TEACHER', $5, $6, TRUE) RETURNING *`,
      [instituteId, data.name, data.email, hashedPassword, data.photo, data.phone]
    );
    const user = rowToCamel(userResult.rows[0]);

    const teacherResult = await query(
      `INSERT INTO teachers (user_id, institute_id, employee_id, department, joining_date, qualifications)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        user.id,
        instituteId,
        data.employeeId,
        data.department,
        data.joiningDate ? new Date(data.joiningDate) : null,
        data.qualifications,
      ]
    );
    const teacher = rowToCamel(teacherResult.rows[0]);

    for (const sid of data.subjectIds) {
      await query(
        `INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [teacher.id, sid]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Teacher created successfully',
      data: { ...user, password: undefined, teacherProfile: teacher },
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
};

export const listTeachers = async (req, res, next) => {
  try {
    const instituteId = await resolveInstituteId(req.user, req.query.instituteId);
    const result = await query(
      `SELECT u.id, u.name, u.email, u.phone, u.is_active, u.created_at,
              t.id AS profile_id, t.employee_id, t.department
       FROM users u
       JOIN teachers t ON t.user_id = u.id
       WHERE u.institute_id = $1 AND u.role = 'TEACHER'
       ORDER BY u.name`,
      [instituteId]
    );
    res.json({ success: true, data: result.rows.map((r) => rowToCamel(r)) });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

export const getTeacher = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT u.*, t.id AS teacher_profile_id, t.employee_id, t.department
       FROM users u
       LEFT JOIN teachers t ON t.user_id = u.id
       WHERE (u.id = $1 OR t.id = $1) AND u.role = 'TEACHER'`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Teacher not found' });
    const { password, ...rest } = rowToCamel(result.rows[0]);
    res.json({ success: true, data: rest });
  } catch (error) {
    next(error);
  }
};

export const updateTeacher = async (req, res, next) => {
  try {
    const { name, employeeId, employeeCode, department, isActive, photo, phone } = req.body;
    await query(
      `UPDATE users SET name = COALESCE($2, name), is_active = COALESCE($3, is_active),
       photo = COALESCE($4, photo), phone = COALESCE($5, phone), updated_at = NOW() WHERE id = $1`,
      [req.params.id, name, isActive, photo, phone]
    );
    await query(
      `UPDATE teachers SET employee_id = COALESCE($2, employee_id), department = COALESCE($3, department),
       updated_at = NOW() WHERE user_id = $1`,
      [req.params.id, employeeId || employeeCode, department]
    );
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const deleteTeacher = async (req, res, next) => {
  try {
    await query(`DELETE FROM users WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
