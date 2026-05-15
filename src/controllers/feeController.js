import { query } from '../config/db.js';
import { rowToCamel, rowsToCamel } from '../utils/dbRow.js';

export async function createFee(req, res, next) {
  try {
    const result = await query(
      `INSERT INTO fees (institute_id, student_id, title, amount, due_date, status) VALUES ($1,$2,$3,$4,$5,'PENDING') RETURNING *`,
      [req.user.instituteId, req.body.studentId, req.body.title, req.body.amount, new Date(req.body.dueDate)]
    );
    res.status(201).json(rowToCamel(result.rows[0]));
  } catch (err) { next(err); }
}

export async function listFees(req, res, next) {
  try {
    const result = await query(`SELECT * FROM fees WHERE institute_id = $1 ORDER BY created_at DESC`, [req.user.instituteId]);
    res.json(rowsToCamel(result.rows));
  } catch (err) { next(err); }
}

export async function recordPayment(req, res, next) {
  try {
    const { feeId, amount } = req.body;
    const fee = await query(`SELECT * FROM fees WHERE id = $1`, [feeId]);
    if (!fee.rows.length) return res.status(404).json({ error: 'Fee not found' });
    const newPaid = parseFloat(fee.rows[0].paid_amount) + parseFloat(amount);
    const status = newPaid >= parseFloat(fee.rows[0].amount) ? 'PAID' : 'PARTIAL';
    const result = await query(
      `UPDATE fees SET paid_amount = $2, status = $3, payment_date = NOW() WHERE id = $1 RETURNING *`,
      [feeId, newPaid, status]
    );
    res.json(rowToCamel(result.rows[0]));
  } catch (err) { next(err); }
}

export async function getFeeAnalytics(req, res, next) {
  try {
    const result = await query(
      `SELECT COALESCE(SUM(amount),0) AS total, COALESCE(SUM(paid_amount),0) AS collected FROM fees WHERE institute_id = $1`,
      [req.user.instituteId]
    );
    const r = result.rows[0];
    res.json({ summary: { totalRevenue: r.total, totalCollected: r.collected, totalPending: r.total - r.collected } });
  } catch (err) { next(err); }
}
