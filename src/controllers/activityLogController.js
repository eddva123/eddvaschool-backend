import { query } from '../config/db.js';
import { rowsToCamel } from '../utils/dbRow.js';

export async function listActivityLogs(req, res, next) {
  try {
    const where = req.user?.role === 'INSTITUTE_ADMIN' ? 'WHERE institute_id = $1' : '';
    const params = req.user?.role === 'INSTITUTE_ADMIN' ? [req.user.instituteId] : [];
    const result = await query(
      `SELECT * FROM activity_logs ${where} ORDER BY created_at DESC LIMIT 100`,
      params
    );
    res.json(rowsToCamel(result.rows));
  } catch (err) {
    next(err);
  }
}

export async function createActivityLog(req, res, next) {
  try {
    const result = await query(
      `INSERT INTO activity_logs (action, user_id, institute_id) VALUES ($1, $2, $3) RETURNING *`,
      [req.body.action, req.body.userId, req.body.instituteId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}
