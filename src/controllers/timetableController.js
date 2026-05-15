import { query } from '../config/db.js';
import { rowToCamel, rowsToCamel } from '../utils/dbRow.js';

export const createTimetable = async (req, res, next) => {
  try {
    const { sectionId, subjectId, teacherId, dayOfWeek, startTime, endTime } = req.body;
    const result = await query(
      `INSERT INTO timetables (institute_id, section_id, subject_id, teacher_id, day_of_week, start_time, end_time)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.instituteId, sectionId, subjectId, teacherId, dayOfWeek, startTime, endTime]
    );
    res.status(201).json(rowToCamel(result.rows[0]));
  } catch (e) { next(e); }
};

export const getTimetable = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM timetables WHERE institute_id = $1 ORDER BY day_of_week, start_time`,
      [req.user.instituteId]
    );
    res.json(rowsToCamel(result.rows));
  } catch (e) { next(e); }
};

export const updateTimetable = async (req, res, next) => {
  try {
    const { sectionId, subjectId, teacherId, dayOfWeek, startTime, endTime } = req.body;
    const result = await query(
      `UPDATE timetables SET section_id=$2, subject_id=$3, teacher_id=$4, day_of_week=$5, start_time=$6, end_time=$7 WHERE id=$1 RETURNING *`,
      [req.params.id, sectionId, subjectId, teacherId, dayOfWeek, startTime, endTime]
    );
    res.json(rowToCamel(result.rows[0]));
  } catch (e) { next(e); }
};

export const deleteTimetable = async (req, res, next) => {
  try {
    await query(`DELETE FROM timetables WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (e) { next(e); }
};
