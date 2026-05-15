import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { rowToCamel, rowsToCamel } from '../utils/dbRow.js';

/** Resolve institute for super admin operations */
async function resolveInstituteId(instituteId) {
  if (instituteId) {
    const r = await query(`SELECT id FROM institutes WHERE id = $1`, [instituteId]);
    if (!r.rows.length) throw { status: 404, message: 'Institute not found' };
    return instituteId;
  }
  const r = await query(`SELECT id FROM institutes WHERE status = 'ACTIVE' ORDER BY created_at LIMIT 1`);
  if (!r.rows.length) {
    throw { status: 400, message: 'No active institute. Create or approve an institute first.' };
  }
  return r.rows[0].id;
}

/** Super Admin: onboard a teacher */
export async function onboardTeacher(data) {
  const instituteId = await resolveInstituteId(data.instituteId);
  const {
    name, email, password, employeeId, department, joiningDate, qualifications,
    subjectIds = [], photo, phone,
  } = data;

  if (!name || !email || !password) {
    throw { status: 400, message: 'Name, email, and password are required.' };
  }

  const existing = await query(`SELECT id FROM users WHERE LOWER(email) = LOWER($1)`, [email]);
  if (existing.rows.length) throw { status: 400, message: 'Email already exists' };

  const hashedPassword = await bcrypt.hash(password, 10);

  const userResult = await query(
    `INSERT INTO users (institute_id, name, email, password, role, photo, phone, is_active)
     VALUES ($1, $2, $3, $4, 'TEACHER', $5, $6, TRUE)
     RETURNING id, name, email, role, institute_id, photo, phone, is_active`,
    [instituteId, name, email.toLowerCase(), hashedPassword, photo || null, phone || null]
  );
  const user = rowToCamel(userResult.rows[0]);

  const teacherResult = await query(
    `INSERT INTO teachers (user_id, institute_id, employee_id, department, joining_date, qualifications)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      user.id, instituteId, employeeId || null, department || null,
      joiningDate ? new Date(joiningDate) : null, qualifications || null,
    ]
  );
  const teacher = rowToCamel(teacherResult.rows[0]);

  for (const subjectId of subjectIds) {
    await query(
      `INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [teacher.id, subjectId]
    );
  }

  await query(
    `INSERT INTO activity_logs (action, user_id, institute_id) VALUES ($1, $2, $3)`,
    [`Super Admin onboarded teacher: ${name}`, user.id, instituteId]
  );

  return { user: { ...user, password: undefined }, teacher };
}

/** Super Admin: onboard a student */
export async function onboardStudent(data) {
  const instituteId = await resolveInstituteId(data.instituteId);
  const {
    name, email, password, enrollmentNo, rollNo, sectionId, dob, gender,
    fatherName, motherName, parentPhone, parentEmail, photo, phone,
  } = data;

  if (!name || !email || !password) {
    throw { status: 400, message: 'Name, email, and password are required.' };
  }

  const existing = await query(`SELECT id FROM users WHERE LOWER(email) = LOWER($1)`, [email]);
  if (existing.rows.length) throw { status: 400, message: 'Email already exists' };

  const hashedPassword = await bcrypt.hash(password, 10);

  const userResult = await query(
    `INSERT INTO users (institute_id, name, email, password, role, photo, phone, is_active)
     VALUES ($1, $2, $3, $4, 'STUDENT', $5, $6, TRUE)
     RETURNING id, name, email, role, institute_id`,
    [instituteId, name, email.toLowerCase(), hashedPassword, photo || null, phone || null]
  );
  const user = rowToCamel(userResult.rows[0]);

  const studentResult = await query(
    `INSERT INTO students (
      user_id, institute_id, enrollment_no, roll_no, section_id, dob, gender,
      father_name, mother_name, parent_phone, parent_email
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING *`,
    [
      user.id, instituteId, enrollmentNo || null, rollNo || null, sectionId || null,
      dob ? new Date(dob) : null, gender || null,
      fatherName || null, motherName || null, parentPhone || null, parentEmail || null,
    ]
  );
  const student = rowToCamel(studentResult.rows[0]);

  await query(
    `INSERT INTO activity_logs (action, user_id, institute_id) VALUES ($1, $2, $3)`,
    [`Super Admin onboarded student: ${name}`, user.id, instituteId]
  );

  return { user: { ...user, password: undefined }, student };
}

/** Curriculum: list full tree for an institute */
export async function getCurriculum(instituteId) {
  const instId = await resolveInstituteId(instituteId);

  const classes = await query(
    `SELECT c.*, COALESCE(json_agg(DISTINCT jsonb_build_object(
      'id', s.id, 'name', s.name, 'classTeacherId', s.class_teacher_id
    )) FILTER (WHERE s.id IS NOT NULL), '[]') AS sections
     FROM classes c
     LEFT JOIN sections s ON s.class_id = c.id
     WHERE c.institute_id = $1
     GROUP BY c.id ORDER BY c.level NULLS LAST, c.name`,
    [instId]
  );

  const subjects = await query(
    `SELECT * FROM subjects WHERE institute_id = $1 ORDER BY name`,
    [instId]
  );

  const topics = await query(
    `SELECT t.*, s.name AS subject_name,
            COALESCE(json_agg(jsonb_build_object(
              'id', ch.id, 'name', ch.name, 'order', ch."order", 'progress', ch.progress, 'status', ch.status
            ) ORDER BY ch."order") FILTER (WHERE ch.id IS NOT NULL), '[]') AS chapters
     FROM topics t
     JOIN subjects s ON t.subject_id = s.id
     LEFT JOIN chapters ch ON ch.topic_id = t.id
     WHERE s.institute_id = $1
     GROUP BY t.id, s.name
     ORDER BY s.name, t.name`,
    [instId]
  );

  return {
    instituteId: instId,
    classes: classes.rows.map((r) => rowToCamel({ ...r, sections: r.sections })),
    subjects: rowsToCamel(subjects.rows),
    topics: topics.rows.map((r) => rowToCamel({ ...r, chapters: r.chapters })),
  };
}

/** Create class */
export async function createClass(data) {
  const instituteId = await resolveInstituteId(data.instituteId);
  const { name, level, sectionNames = [] } = data;

  const result = await query(
    `INSERT INTO classes (institute_id, name, level) VALUES ($1, $2, $3) RETURNING *`,
    [instituteId, name, level ? parseInt(level) : null]
  );
  const cls = rowToCamel(result.rows[0]);

  for (const sName of sectionNames.filter(Boolean)) {
    await query(`INSERT INTO sections (class_id, name) VALUES ($1, $2)`, [cls.id, sName.trim()]);
  }

  const sections = await query(`SELECT * FROM sections WHERE class_id = $1`, [cls.id]);
  return { ...cls, sections: rowsToCamel(sections.rows) };
}

/** Create subject */
export async function createSubject(data) {
  const instituteId = await resolveInstituteId(data.instituteId);
  const { name, code, classIds = [] } = data;

  const result = await query(
    `INSERT INTO subjects (institute_id, name, code) VALUES ($1, $2, $3) RETURNING *`,
    [instituteId, name, code || null]
  );
  const subject = rowToCamel(result.rows[0]);

  for (const classId of classIds) {
    await query(
      `INSERT INTO class_subjects (class_id, subject_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [classId, subject.id]
    );
  }

  return subject;
}

/** Create topic (curriculum unit) */
export async function createTopic(data) {
  const instituteId = await resolveInstituteId(data.instituteId);
  const { name, subjectId, classId } = data;

  const subCheck = await query(
    `SELECT id FROM subjects WHERE id = $1 AND institute_id = $2`,
    [subjectId, instituteId]
  );
  if (!subCheck.rows.length) throw { status: 404, message: 'Subject not found' };

  const result = await query(
    `INSERT INTO topics (institute_id, subject_id, class_id, name, progress, status)
     VALUES ($1, $2, $3, $4, 0, 'pending') RETURNING *`,
    [instituteId, subjectId, classId || null, name]
  );
  return rowToCamel(result.rows[0]);
}

/** Add chapter to topic */
export async function addChapter(topicId, data) {
  const { name, order } = data;
  const topicCheck = await query(`SELECT id FROM topics WHERE id = $1`, [topicId]);
  if (!topicCheck.rows.length) throw { status: 404, message: 'Topic not found' };

  const result = await query(
    `INSERT INTO chapters (topic_id, name, "order") VALUES ($1, $2, $3) RETURNING *`,
    [topicId, name, Number(order) || 1]
  );
  return rowToCamel(result.rows[0]);
}
