import { query } from '../config/db.js';
import { rowToCamel, rowsToCamel } from '../utils/dbRow.js';

export const createEvent = async (req, res, next) => {
  try {
    const result = await query(
      `INSERT INTO events (institute_id, title, description, category, start_time, end_time, is_all_day, location, priority, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.user.instituteId, req.body.title, req.body.description, req.body.category || 'ACADEMIC', new Date(req.body.startTime), new Date(req.body.endTime), !!req.body.isAllDay, req.body.location, req.body.priority || 'NORMAL', req.user.id]
    );
    res.status(201).json(rowToCamel(result.rows[0]));
  } catch (e) { next(e); }
};

export const listEvents = async (req, res, next) => {
  try {
    const result = await query(`SELECT * FROM events WHERE institute_id = $1 ORDER BY start_time`, [req.user.instituteId]);
    res.json(rowsToCamel(result.rows));
  } catch (e) { next(e); }
};

export const deleteEvent = async (req, res, next) => {
  try {
    await query(`DELETE FROM events WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (e) { next(e); }
};
