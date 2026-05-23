import { query } from '../config/db.js';
import asyncHandler from '../utils/asyncHandler.js';
import { resolveInstituteId } from '../utils/instituteScope.js';

export const getSubjects = asyncHandler(async (req, res, next) => {
  const instituteId = await resolveInstituteId(req.user, req.query.instituteId);

  const result = await query(
    `SELECT id, name, code, institute_id, created_at
     FROM subjects
     WHERE institute_id = $1
     ORDER BY name ASC`,
    [instituteId]
  );

  res.status(200).json({
    success: true,
    message: 'Subjects fetched successfully',
    count: result.rows.length,
    data: result.rows,
  });
});
