import { query } from '../config/db.js';
import asyncHandler from '../utils/asyncHandler.js';
import APIError from '../utils/APIError.js';

export const createAssignment = asyncHandler(async (req, res, next) => {
  const {
    title,
    type,
    subject_id,
    class_id,
    due_date,
    instructions
  } = req.body;

  if (!title || !type || !subject_id || !class_id) {
    return next(new APIError('Missing required fields', 400));
  }
  
  const file_path = req.file ? req.file.path : null;

  const result = await query(
    `
      INSERT INTO assignments 
      (
        title,
        type,
        subject_id,
        class_id,
        due_date,
        instructions,
        file_path
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `,
    [
      title,
      type,
      subject_id,
      class_id,
      due_date || null,
      instructions || '',
      file_path
    ]
  );

  res.status(201).json({
    success: true,
    message: 'Assignment created successfully',
    data: result.rows[0]
  });
});

export const getAssignments = asyncHandler(async (req, res, next) => {
  const result = await query(`
    SELECT 
      a.*,
      s.name AS subject_name,
      c.name AS class_name
    FROM assignments a
    LEFT JOIN subjects s ON a.subject_id = s.id
    LEFT JOIN classes c ON a.class_id = c.id
    ORDER BY a.created_at DESC
  `);

  res.status(200).json({
    success: true,
    count: result.rows.length,
    data: result.rows
  });
});

export const deleteAssignment = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const result = await query(
    `
      DELETE FROM assignments
      WHERE id = $1
      RETURNING *
    `,
    [id]
  );

  if (result.rows.length === 0) {
    return next(
      new APIError('Assignment not found', 404)
    );
  }

  res.status(200).json({
    success: true,
    message: 'Assignment deleted successfully',
  });
});