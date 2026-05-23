import { query } from '../config/db.js';
import { rowToCamel, rowsToCamel } from '../utils/dbRow.js';

export const createNotice = async (req, res, next) => {
  try {
    const result = await query(
      `INSERT INTO notices (institute_id, title, content, category, priority, target_roles)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.instituteId, req.body.title, req.body.content, req.body.category || 'GENERAL', req.body.priority || 'NORMAL', req.body.targetRoles || []]
    );
    res.status(201).json(rowToCamel(result.rows[0]));
  } catch (e) { next(e); }
};

export const listNotices = async (req, res, next) => {
  try {
    const result = await query(`SELECT * FROM notices WHERE institute_id = $1 ORDER BY created_at DESC`, [req.user.instituteId]);
    res.json(rowsToCamel(result.rows));
  } catch (e) { next(e); }
};

export const updateNotice = async (req, res, next) => {
  try {
    const result = await query(
      `UPDATE notices SET title = $2, content = $3 WHERE id = $1 RETURNING *`,
      [req.params.id, req.body.title, req.body.content]
    );
    res.json(rowToCamel(result.rows[0]));
  } catch (e) { next(e); }
};

export const deleteNotice = async (req, res, next) => {
  try {
    await query(`DELETE FROM notices WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (e) { next(e); }
};
