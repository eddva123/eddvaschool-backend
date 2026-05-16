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
    `SELECT enrollment_no FROM students WHERE institute_id = $1 AND enrollment_no LIKE $2`,
    [instituteId, `${prefix}%`]
  );
  const max = existing.rows.reduce((highest, row) => {
    const n = Number(String(row.enrollment_no || '').replace(prefix, ''));
    return Number.isFinite(n) ? Math.max(highest, n) : highest;
  }, 0);
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

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
    bloodGroup: body.bloodGroup || null,
    maritalStatus: body.maritalStatus || null,
    nationalId: body.nationalId || null,
    fatherName: body.fatherName || body.parentName || null,
    motherName: body.motherName || null,
    parentPhone: body.parentPhone || body.guardianPhone || null,
    parentEmail: body.parentEmail || null,
    parentOccupation: body.parentOccupation || null,
    address: body.address || body.currentAddress || null,
    city: body.city || null,
    state: body.state || null,
    pinCode: body.pinCode || null,
    admissionDate: body.admissionDate || null,
    medicalConditions: body.medicalConditions || null,
    allergies: body.allergies || null,
    documents: body.documents || {},
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

    const enrollmentNo = data.enrollmentNo || await generateScopedId(instituteId);
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const userResult = await query(
      `INSERT INTO users (institute_id, name, email, password, role, photo, phone, is_active)
       VALUES ($1, $2, $3, $4, 'STUDENT', $5, $6, TRUE) RETURNING *`,
      [instituteId, data.name, data.email, hashedPassword, data.photo, data.phone]
    );
    const user = rowToCamel(userResult.rows[0]);

    const studentResult = await query(
      `INSERT INTO students (user_id, institute_id, enrollment_no, roll_no, section_id, dob, gender,
        blood_group, marital_status, national_id, father_name, mother_name, parent_phone, parent_email,
        parent_occupation, address, city, state, pin_code, admission_date, medical_conditions, allergies, documents)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23) RETURNING *`,
      [
        user.id, instituteId, enrollmentNo, data.rollNo, data.sectionId,
        data.dob ? new Date(data.dob) : null, data.gender,
        data.bloodGroup, data.maritalStatus, data.nationalId, data.fatherName, data.motherName,
        data.parentPhone, data.parentEmail, data.parentOccupation, data.address, data.city, data.state,
        data.pinCode, data.admissionDate ? new Date(data.admissionDate) : null,
        data.medicalConditions, data.allergies, JSON.stringify(data.documents),
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
              s.dob, s.gender, s.blood_group, s.marital_status, s.national_id,
              s.father_name, s.mother_name, s.parent_phone, s.parent_email, s.parent_occupation,
              s.address, s.city, s.state, s.pin_code, s.admission_date, s.medical_conditions, s.allergies,
              sec.name AS section_name, c.name AS class_name
       FROM users u
       JOIN students s ON s.user_id = u.id
       LEFT JOIN sections sec ON s.section_id = sec.id
       LEFT JOIN classes c ON sec.class_id = c.id
       WHERE u.institute_id = $1 AND u.role = 'STUDENT'
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
        photo: r.photo,
        isActive: r.isActive,
        createdAt: r.createdAt,
        studentProfile: {
          id: r.profileId,
          enrollmentNo: r.enrollmentNo,
          rollNo: r.rollNo,
          sectionId: r.sectionId,
          dob: r.dob,
          gender: r.gender,
          bloodGroup: r.bloodGroup,
          maritalStatus: r.maritalStatus,
          nationalId: r.nationalId,
          fatherName: r.fatherName,
          motherName: r.motherName,
          parentPhone: r.parentPhone,
          parentEmail: r.parentEmail,
          parentOccupation: r.parentOccupation,
          address: r.address,
          city: r.city,
          state: r.state,
          pinCode: r.pinCode,
          admissionDate: r.admissionDate,
          medicalConditions: r.medicalConditions,
          allergies: r.allergies,
          section: r.sectionId ? { id: r.sectionId, name: r.sectionName, class: { name: r.className } } : null,
        },
      };
    });
    res.json({ success: true, data });
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
    const {
      name, enrollmentNo, rollNo, sectionId, dob, gender, bloodGroup, maritalStatus,
      nationalId, fatherName, motherName, parentPhone, parentEmail, parentOccupation,
      address, currentAddress, city, state, pinCode, admissionDate, medicalConditions,
      allergies, documents, isActive, photo, phone
    } = req.body;

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
       section_id = COALESCE($4, section_id), dob = COALESCE($5, dob), gender = COALESCE($6, gender),
       blood_group = COALESCE($7, blood_group), marital_status = COALESCE($8, marital_status),
       national_id = COALESCE($9, national_id), father_name = COALESCE($10, father_name),
       mother_name = COALESCE($11, mother_name), parent_phone = COALESCE($12, parent_phone),
       parent_email = COALESCE($13, parent_email), parent_occupation = COALESCE($14, parent_occupation),
       address = COALESCE($15, address), city = COALESCE($16, city), state = COALESCE($17, state),
       pin_code = COALESCE($18, pin_code), admission_date = COALESCE($19, admission_date),
       medical_conditions = COALESCE($20, medical_conditions), allergies = COALESCE($21, allergies),
       documents = COALESCE($22::jsonb, documents), updated_at = NOW() WHERE user_id = $1`,
      [
        userId, enrollmentNo, rollNo, sectionId, dob ? new Date(dob) : null, gender,
        bloodGroup, maritalStatus, nationalId, fatherName, motherName, parentPhone,
        parentEmail, parentOccupation, address || currentAddress, city, state, pinCode,
        admissionDate ? new Date(admissionDate) : null, medicalConditions, allergies,
        documents ? JSON.stringify(documents) : null,
      ]
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
