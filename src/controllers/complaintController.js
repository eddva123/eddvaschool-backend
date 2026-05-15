import { query } from '../config/db.js';
import { rowToCamel, rowsToCamel } from '../utils/dbRow.js';

export async function createComplaint(req, res, next) {
  try {
    const instituteId = req.user?.role === 'INSTITUTE_ADMIN' ? req.user.instituteId : req.body.instituteId;
    if (!instituteId) return res.status(400).json({ error: 'Institute is required.' });
    const result = await query(
      `INSERT INTO complaints (institute_id, title, description, status) VALUES ($1, $2, $3, $4) RETURNING *`,
      [instituteId, req.body.title, req.body.description, req.body.status || 'OPEN']
    );
    res.status(201).json(rowToCamel(result.rows[0]));
  } catch (err) {
    next(err);
  }
}

export async function updateComplaint(req, res, next) {
  try {
    const result = await query(
      `UPDATE complaints SET title = COALESCE($2, title), description = COALESCE($3, description), status = COALESCE($4, status) WHERE id = $1 RETURNING *`,
      [req.params.id, req.body.title, req.body.description, req.body.status]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Complaint not found' });
    res.json(rowToCamel(result.rows[0]));
  } catch (err) {
    next(err);
  }
}

export async function listComplaints(req, res, next) {
  try {
    const where = req.user?.role === 'INSTITUTE_ADMIN' ? 'WHERE institute_id = $1' : '';
    const params = req.user?.role === 'INSTITUTE_ADMIN' ? [req.user.instituteId] : [];
    const result = await query(`SELECT * FROM complaints ${where} ORDER BY created_at DESC`, params);
    res.json(rowsToCamel(result.rows));
  } catch (err) {
    next(err);
  }
}
