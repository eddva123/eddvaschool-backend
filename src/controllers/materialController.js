import { query } from '../config/db.js';

import asyncHandler from '../utils/asyncHandler.js';
import APIError from '../utils/APIError.js';

// ======================================
// UPLOAD MATERIAL
// ======================================
export const uploadMaterial =
  asyncHandler(async (req, res, next) => {
    const { title, chapter_id } =
      req.body;

    if (!req.file) {
      return next(
        new APIError(
          'File upload required',
          400
        )
      );
    }

    if (!title || !chapter_id) {
      return next(
        new APIError(
          'Title and chapter are required',
          400
        )
      );
    }

    const result = await query(
      `
      INSERT INTO materials
      (
        chapter_id,
        title,
        file_name,
        file_url,
        file_type,
        file_size,
        uploaded_by
      )

      VALUES
      ($1, $2, $3, $4, $5, $6, $7)

      RETURNING *
      `,
      [
        chapter_id,
        title,
        req.file.filename,
        `/uploads/${req.file.filename}`,
        req.file.mimetype,
        req.file.size,
        req.user.id,
      ]
    );

    res.status(201).json({
      success: true,
      message:
        'Material uploaded successfully',
      data: result.rows[0],
    });
  });

// ======================================
// GET MATERIALS
// ======================================
export const getMaterials =
  asyncHandler(async (req, res, next) => {
    const { chapterId } =
      req.params;

    const result = await query(
      `
      SELECT *
      FROM materials
      WHERE chapter_id = $1
      ORDER BY created_at DESC
      `,
      [chapterId]
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  });