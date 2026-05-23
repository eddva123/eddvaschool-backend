import { query } from '../config/db.js';
import asyncHandler from '../utils/asyncHandler.js';

// =====================================
// GET ALL PRESENTATIONS
// =====================================
export const getPresentations =
  asyncHandler(async (req, res) => {

    const result = await query(`
      SELECT *
      FROM presentations
      ORDER BY created_at DESC
    `);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
});

// =====================================
// CREATE PRESENTATION
// =====================================
export const createPresentation =
  asyncHandler(async (req, res) => {

    try {
console.log(req.body);
console.log(req.file);
      const {
        title,
        subject,
        description,
        template,
      } = req.body;

      const pptFile =
  req.file
    ? req.file.path
    : null;

      const result = await query(
  `
  INSERT INTO presentations
  (
    title,
    subject,
    description,
    template,
    ppt_file,
    slides_count,
    status
  )

  VALUES ($1, $2, $3, $4, $5, $6, $7)

  RETURNING *
  `,
  [
    title,
    subject,
    description,
    template,
    pptFile,
    0,
    'draft',
  ]
);

      res.status(201).json({
        success: true,
        data: result.rows[0],
      });

    } catch (error) {

      console.log(error);

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
});

// =====================================
// GET MIND MAPS
// =====================================
export const getMindMaps =
  asyncHandler(async (req, res) => {

    const result = await query(
      `
      SELECT *
      FROM mind_maps
      ORDER BY created_at DESC
      `
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
});

// =====================================
// CREATE MIND MAP
// =====================================
export const createMindMap =
  asyncHandler(async (req, res) => {

    try {

      const {
        title,
        centralTopic,
        branches,
      } = req.body;

      const nodes =
        branches.split(',').length;

      const result = await query(
        `
        INSERT INTO mind_maps
        (
          title,
          central_topic,
          branches,
          nodes,
          status
        )

        VALUES ($1, $2, $3, $4, $5)

        RETURNING *
        `,
        [
          title,
          centralTopic,
          branches.split(','),
          nodes,
          'active',
        ]
      );

      res.status(201).json({
        success: true,
        data: result.rows[0],
      });

    } catch (error) {

      console.log('MIND MAP ERROR:',
  error.message
);

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
});