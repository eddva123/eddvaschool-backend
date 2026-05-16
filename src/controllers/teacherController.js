import { query } from '../config/db.js';
import bcrypt from 'bcryptjs';
import { rowToCamel } from '../utils/dbRow.js';
import { resolveInstituteId } from '../utils/instituteScope.js';

function instituteCode(name = 'Eddva School') {
  const words = String(name)
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const code = words.length > 1 ? words.map((word) => word[0]).join('') : (words[0] || 'EDDVA').slice(0, 3);
  return code.toUpperCase().slice(0, 6);
}

async function generateScopedId(instituteId) {
  const inst = await query(`SELECT name FROM institutes WHERE id = $1`, [instituteId]);
  const code = instituteCode(inst.rows[0]?.name);
  const year = new Date().getFullYear();
  const prefix = `${code}-${year}-`;
  const existing = await query(
    `SELECT employee_id FROM teachers WHERE institute_id = $1 AND employee_id LIKE $2`,
    [instituteId, `${prefix}%`]
  );
  const max = existing.rows.reduce((highest, row) => {
    const n = Number(String(row.employee_id || '').replace(prefix, ''));
    return Number.isFinite(n) ? Math.max(highest, n) : highest;
  }, 0);
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

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
    bloodGroup: body.bloodGroup || null,
    maritalStatus: body.maritalStatus || null,
    department: body.department || null,
    joiningDate: body.joiningDate || body.joinDate || null,
    qualifications,
    educationDetails: Array.isArray(body.educationDetails) ? body.educationDetails : [],
    experienceDetails: Array.isArray(body.experienceDetails) ? body.experienceDetails : [],
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

    const employeeId = data.employeeId || await generateScopedId(instituteId);
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const userResult = await query(
      `INSERT INTO users (institute_id, name, email, password, role, photo, phone, is_active)
       VALUES ($1, $2, $3, $4, 'TEACHER', $5, $6, TRUE) RETURNING *`,
      [instituteId, data.name, data.email, hashedPassword, data.photo, data.phone]
    );
    const user = rowToCamel(userResult.rows[0]);

    const teacherResult = await query(
      `INSERT INTO teachers (
        user_id, institute_id, employee_id, blood_group, marital_status, department,
        joining_date, qualifications, education_details, experience_details
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        user.id,
        instituteId,
        employeeId,
        data.bloodGroup,
        data.maritalStatus,
        data.department,
        data.joiningDate ? new Date(data.joiningDate) : null,
        data.qualifications,
        JSON.stringify(data.educationDetails),
        JSON.stringify(data.experienceDetails),
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
              t.id AS profile_id, t.employee_id, t.blood_group, t.marital_status,
              t.department, t.joining_date, t.qualifications, t.education_details, t.experience_details
       FROM users u
       JOIN teachers t ON t.user_id = u.id
       WHERE u.institute_id = $1 AND u.role = 'TEACHER'
       ORDER BY u.name`,
      [instituteId]
    );
    const data = result.rows.map((row) => {
      const r = rowToCamel(row);
      return {
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        isActive: r.isActive,
        createdAt: r.createdAt,
        teacherProfile: {
          id: r.profileId,
          employeeId: r.employeeId,
          bloodGroup: r.bloodGroup,
          maritalStatus: r.maritalStatus,
          department: r.department,
          joiningDate: r.joiningDate,
          qualifications: r.qualifications,
          educationDetails: r.educationDetails || [],
          experienceDetails: r.experienceDetails || [],
        },
      };
    });
    res.json({ success: true, data });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

export const getTeacher = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT u.*, t.id AS teacher_profile_id, t.employee_id, t.blood_group, t.marital_status,
              t.department, t.joining_date, t.qualifications, t.education_details, t.experience_details
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
    const {
      name, employeeId, employeeCode, bloodGroup, maritalStatus, department,
      joiningDate, qualifications, educationDetails, experienceDetails, isActive, photo, phone
    } = req.body;
    await query(
      `UPDATE users SET name = COALESCE($2, name), is_active = COALESCE($3, is_active),
       photo = COALESCE($4, photo), phone = COALESCE($5, phone), updated_at = NOW() WHERE id = $1`,
      [req.params.id, name, isActive, photo, phone]
    );
    await query(
      `UPDATE teachers SET employee_id = COALESCE($2, employee_id), blood_group = COALESCE($3, blood_group),
       marital_status = COALESCE($4, marital_status), department = COALESCE($5, department),
       joining_date = COALESCE($6, joining_date), qualifications = COALESCE($7, qualifications),
       education_details = COALESCE($8::jsonb, education_details), experience_details = COALESCE($9::jsonb, experience_details),
       updated_at = NOW() WHERE user_id = $1`,
      [
        req.params.id,
        employeeId || employeeCode,
        bloodGroup,
        maritalStatus,
        department,
        joiningDate ? new Date(joiningDate) : null,
        qualifications,
        Array.isArray(educationDetails) ? JSON.stringify(educationDetails) : null,
        Array.isArray(experienceDetails) ? JSON.stringify(experienceDetails) : null,
      ]
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
