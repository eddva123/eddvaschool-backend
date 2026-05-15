import { query } from '../config/db.js';
import { rowToCamel, rowsToCamel } from '../utils/dbRow.js';
import { resolveInstituteId } from '../utils/instituteScope.js';

export const createClass = async (req, res, next) => {
  try {
    const { name, level, section } = req.body;
    const instituteId = await resolveInstituteId(req.user, req.body.instituteId);
    const result = await query(
      `INSERT INTO classes (institute_id, name, level) VALUES ($1, $2, $3) RETURNING *`,
      [instituteId, name, level ? parseInt(level) : null]
    );
    const cls = rowToCamel(result.rows[0]);
    if (section) {
      for (const s of section.split(',').map((x) => x.trim()).filter(Boolean)) {
        await query(`INSERT INTO sections (class_id, name) VALUES ($1, $2)`, [cls.id, s]);
      }
    }
    const sections = await query(`SELECT * FROM sections WHERE class_id = $1`, [cls.id]);
    res.status(201).json({ ...cls, sections: rowsToCamel(sections.rows) });
  } catch (e) { next(e); }
};

export const listClasses = async (req, res, next) => {
  try {
    const instituteId = await resolveInstituteId(req.user, req.query.instituteId);
    const result = await query(
      `SELECT c.*, COALESCE(json_agg(jsonb_build_object('id', s.id, 'name', s.name)) FILTER (WHERE s.id IS NOT NULL), '[]') AS sections
       FROM classes c LEFT JOIN sections s ON s.class_id = c.id
       WHERE c.institute_id = $1 GROUP BY c.id ORDER BY c.level NULLS LAST`,
      [instituteId]
    );
    res.json(result.rows.map((r) => rowToCamel(r)));
  } catch (e) { next(e); }
};

export const updateClass = async (req, res, next) => {
  try {
    await query(`UPDATE classes SET name = $2, level = $3, updated_at = NOW() WHERE id = $1`, [req.params.id, req.body.name, req.body.level]);
    res.json({ success: true });
  } catch (e) { next(e); }
};

export const deleteClass = async (req, res, next) => {
  try {
    await query(`DELETE FROM classes WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (e) { next(e); }
};

export const createSection = async (req, res, next) => {
  try {
    const { name, classTeacherId } = req.body;
    const result = await query(
      `INSERT INTO sections (class_id, name, class_teacher_id) VALUES ($1, $2, $3) RETURNING *`,
      [req.params.classId, name, classTeacherId || null]
    );
    res.status(201).json(rowToCamel(result.rows[0]));
  } catch (e) { next(e); }
};

export const updateSection = async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE sections SET name = $2, class_teacher_id = $3, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id, req.body.name, req.body.classTeacherId || null]
    );
    res.json(rowToCamel(result.rows[0]));
  } catch (e) { next(e); }
};

export const deleteSection = async (req, res, next) => {
  try {
    await query(`DELETE FROM sections WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (e) { next(e); }
};

export const createSubject = async (req, res, next) => {
  try {
    const { name, code, classIds } = req.body;
    const instituteId = await resolveInstituteId(req.user, req.body.instituteId);
    const result = await query(
      `INSERT INTO subjects (institute_id, name, code) VALUES ($1, $2, $3) RETURNING *`,
      [instituteId, name, code || null]
    );
    const subject = rowToCamel(result.rows[0]);
    for (const cid of classIds || []) {
      await query(`INSERT INTO class_subjects (class_id, subject_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [cid, subject.id]);
    }
    res.status(201).json(subject);
  } catch (e) { next(e); }
};

export const listSubjects = async (req, res, next) => {
  try {
    const instituteId = await resolveInstituteId(req.user, req.query.instituteId);
    const result = await query(`SELECT * FROM subjects WHERE institute_id = $1 ORDER BY name`, [instituteId]);
    res.json(rowsToCamel(result.rows));
  } catch (e) { next(e); }
};

export const updateSubject = async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE subjects SET name = $2, code = $3, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id, req.body.name, req.body.code]
    );
    res.json(rowToCamel(result.rows[0]));
  } catch (e) { next(e); }
};

export const deleteSubject = async (req, res, next) => {
  try {
    await query(`DELETE FROM subjects WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (e) { next(e); }
};
