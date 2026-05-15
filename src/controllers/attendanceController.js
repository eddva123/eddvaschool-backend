import { query } from '../config/db.js';
import asyncHandler from '../utils/asyncHandler.js';
import { rowToCamel, rowsToCamel } from '../utils/dbRow.js';

export const markAttendance = async (req, res, next) => {
  try {
    const instituteId = req.user.instituteId;
    const { userId, date, status, remarks } = req.body;
    const targetDate = new Date(date);

    const result = await query(
      `INSERT INTO attendances (institute_id, user_id, date, status, remarks)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (date, user_id) DO UPDATE SET status = EXCLUDED.status, remarks = EXCLUDED.remarks, updated_at = NOW()
       RETURNING *`,
      [instituteId, userId, targetDate, status, remarks || null]
    );
    res.status(200).json(rowToCamel(result.rows[0]));
  } catch (error) {
    next(error);
  }
};

export const getAttendance = async (req, res, next) => {
  try {
    const instituteId = req.user.instituteId;
    const { date, role } = req.query;

    let sql = `
      SELECT a.*, u.name AS user_name, u.email, u.role
      FROM attendances a
      JOIN users u ON a.user_id = u.id
      WHERE a.institute_id = $1`;
    const params = [instituteId];

    if (date) {
      sql += ` AND a.date = $2`;
      params.push(new Date(date));
    }
    if (role) {
      sql += ` AND u.role = $${params.length + 1}`;
      params.push(role);
    }
    sql += ` ORDER BY a.date DESC`;

    const result = await query(sql, params);
    res.json(rowsToCamel(result.rows));
  } catch (error) {
    next(error);
  }
};

export const markSessionAttendance = asyncHandler(async (req, res) => {
  const { schedule_id, date, students } = req.body;

  const session = await query(
    `INSERT INTO attendance_sessions (schedule_id, date, teacher_id) VALUES ($1, $2, $3) RETURNING id`,
    [schedule_id, date, req.user.id]
  );
  const sessionId = session.rows[0].id;

  for (const s of students) {
    await query(
      `INSERT INTO attendance_records (session_id, student_id, status, remarks) VALUES ($1, $2, $3, $4)`,
      [sessionId, s.student_id, s.status, s.remarks || null]
    );
  }

  res.status(200).json({ success: true, message: 'Attendance marked successfully' });
});

export const getAttendanceReport = asyncHandler(async (req, res) => {
  const result = await query(`
    SELECT u.id AS "studentId", u.name,
      COUNT(*) FILTER (WHERE ar.status = 'present') AS present,
      COUNT(*) FILTER (WHERE ar.status = 'absent') AS absent,
      COUNT(*) FILTER (WHERE ar.status = 'late') AS late
    FROM users u
    LEFT JOIN attendance_records ar ON ar.student_id = u.id
    WHERE u.role = 'STUDENT'
    GROUP BY u.id, u.name
    ORDER BY u.name
  `);
  res.status(200).json({ success: true, count: result.rows.length, data: result.rows });
});

export const getStudentsByClass = asyncHandler(async (req, res) => {
  const { class_id } = req.params;
  const result = await query(
    `SELECT u.id, u.name, u.email, s.roll_no
     FROM users u
     JOIN students s ON s.user_id = u.id
     JOIN sections sec ON s.section_id = sec.id
     WHERE sec.class_id = $1
     ORDER BY s.roll_no NULLS LAST, u.name`,
    [class_id]
  );
  res.status(200).json({ success: true, count: result.rows.length, data: result.rows });
});
