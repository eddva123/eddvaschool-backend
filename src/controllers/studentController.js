import { query } from '../config/db.js';
import bcrypt from 'bcryptjs';
import { rowToCamel, rowsToCamel } from '../utils/dbRow.js';
import { resolveInstituteId } from '../utils/instituteScope.js';

function normalizeStudentBody(body) {
  return {
    name: body.name?.trim(),
    email: body.email?.trim().toLowerCase(),
    password: body.password,
    phone: body.phone || null,
    photo: body.photo || null,
    enrollmentNo: body.enrollmentNo || body.enrollmentNumber || body.admissionNo || null,
    rollNo: body.rollNo || body.rollNumber || null,
    sectionId: body.sectionId || null,
    dob: body.dob || null,
    gender: body.gender || null,
    fatherName: body.fatherName || body.parentName || null,
    motherName: body.motherName || null,
    parentPhone: body.parentPhone || body.guardianPhone || null,
    parentEmail: body.parentEmail || null,
  };
}

export const createStudent = async (req, res, next) => {
  try {
    const instituteId = await resolveInstituteId(req.user, req.body.instituteId);
    const data = normalizeStudentBody(req.body);

    if (!data.name || !data.email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    if (!data.password) {
      return res.status(400).json({ error: 'Password is required for student login' });
    }

    const existing = await query(`SELECT id FROM users WHERE LOWER(email) = LOWER($1)`, [data.email]);
    if (existing.rows.length) return res.status(400).json({ error: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const userResult = await query(
      `INSERT INTO users (institute_id, name, email, password, role, photo, phone, is_active)
       VALUES ($1, $2, $3, $4, 'STUDENT', $5, $6, TRUE) RETURNING *`,
      [instituteId, data.name, data.email, hashedPassword, data.photo, data.phone]
    );
    const user = rowToCamel(userResult.rows[0]);

    const studentResult = await query(
      `INSERT INTO students (user_id, institute_id, enrollment_no, roll_no, section_id, dob, gender,
        father_name, mother_name, parent_phone, parent_email)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [
        user.id, instituteId, data.enrollmentNo, data.rollNo, data.sectionId,
        data.dob ? new Date(data.dob) : null, data.gender,
        data.fatherName, data.motherName, data.parentPhone, data.parentEmail,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: { ...user, password: undefined, studentProfile: rowToCamel(studentResult.rows[0]) },
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

export const listStudents = async (req, res, next) => {
  try {
    const instituteId = await resolveInstituteId(req.user, req.query.instituteId);
    const result = await query(
      `SELECT u.id, u.name, u.email, u.phone, u.is_active, u.photo, u.created_at,
              s.id AS profile_id, s.enrollment_no, s.roll_no, s.section_id,
              sec.name AS section_name, c.name AS class_name
       FROM users u
       JOIN students s ON s.user_id = u.id
       LEFT JOIN sections sec ON s.section_id = sec.id
       LEFT JOIN classes c ON sec.class_id = c.id
       WHERE u.institute_id = $1 AND u.role = 'STUDENT'
       ORDER BY u.name`,
      [instituteId]
    );
    res.json({ success: true, data: result.rows.map((r) => rowToCamel(r)) });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

export const getStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT u.*, s.*, sec.name AS section_name, c.name AS class_name
       FROM users u
       LEFT JOIN students s ON s.user_id = u.id
       LEFT JOIN sections sec ON s.section_id = sec.id
       LEFT JOIN classes c ON sec.class_id = c.id
       WHERE (u.id = $1 OR s.id = $1) AND u.role = 'STUDENT'`,
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Student not found' });
    const row = result.rows[0];
    if (req.user.role === 'INSTITUTE_ADMIN' && row.institute_id !== req.user.instituteId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { password, ...rest } = rowToCamel(row);
    res.json({ success: true, data: rest });
  } catch (error) {
    next(error);
  }
};

export const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, enrollmentNo, rollNo, sectionId, isActive, photo, phone } = req.body;

    let userRow = await query(`SELECT * FROM users WHERE id = $1`, [id]);
    if (!userRow.rows.length) {
      userRow = await query(`SELECT u.* FROM users u JOIN students s ON s.user_id = u.id WHERE s.id = $1`, [id]);
    }
    if (!userRow.rows.length) return res.status(404).json({ error: 'Student not found' });

    const userId = userRow.rows[0].id;
    await query(
      `UPDATE users SET name = COALESCE($2, name), is_active = COALESCE($3, is_active),
       photo = COALESCE($4, photo), phone = COALESCE($5, phone), updated_at = NOW() WHERE id = $1`,
      [userId, name, isActive, photo, phone]
    );
    await query(
      `UPDATE students SET enrollment_no = COALESCE($2, enrollment_no), roll_no = COALESCE($3, roll_no),
       section_id = COALESCE($4, section_id), updated_at = NOW() WHERE user_id = $1`,
      [userId, enrollmentNo, rollNo, sectionId]
    );
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const deleteStudent = async (req, res, next) => {
  try {
    await query(`DELETE FROM users WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
