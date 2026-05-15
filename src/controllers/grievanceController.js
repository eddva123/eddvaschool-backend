import { query } from '../config/db.js';
import asyncHandler from '../utils/asyncHandler.js';
import APIError from '../utils/APIError.js';

export const createGrievance = asyncHandler(async (req, res, next) => {
  const { title, category, description } = req.body;
  const result = await query(
    'INSERT INTO grievances (title, category, description, raised_by) VALUES ($1, $2, $3, $4) RETURNING *',
    [title, category, description, req.user.id]
  );
  res.status(201).json({ success: true, data: result.rows[0] });
});

export const getGrievances = asyncHandler(async (req, res, next) => {
  const result = await query(`
    SELECT g.*, u.name as raised_by_name 
    FROM grievances g 
    JOIN users u ON g.raised_by = u.id
  `);
  res.status(200).json({ success: true, count: result.rows.length, data: result.rows });
});

export const updateGrievanceStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  const result = await query(
    'UPDATE grievances SET status = $1 WHERE id = $2 RETURNING *',
    [status, req.params.id]
  );
  if (result.rows.length === 0) return next(new APIError('Grievance not found', 404));
  res.status(200).json({ success: true, data: result.rows[0] });
});
