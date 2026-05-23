import { query } from '../config/db.js';
import asyncHandler from '../utils/asyncHandler.js';
import APIError from '../utils/APIError.js';

export const createSchedule = asyncHandler(async (req, res, next) => {
  try {
    const {
      class_id,
      subject_id,
      teacher_id,
      day_of_week,
      start_time,
      end_time,
      room,
      type
    } = req.body;

    const result = await query(
      `INSERT INTO schedules 
      (class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room, type) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *`,
      [
        class_id,
        subject_id,
        teacher_id,
        day_of_week,
        start_time,
        end_time,
        room,
        type || 'offline'
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export const getSchedules = asyncHandler(async (req, res, next) => {
  const result = await query(`
    SELECT 
      s.*,
      c.name AS class_name,
      sub.name AS subject_name,
      u.name AS teacher_name
    FROM schedules s
    LEFT JOIN classes c ON s.class_id = c.id
    LEFT JOIN subjects sub ON s.subject_id = sub.id
    LEFT JOIN users u ON s.teacher_id = u.id
    ORDER BY s.id DESC
  `);

  res.status(200).json({
    success: true,
    count: result.rows.length,
    data: result.rows
  });
});


export const getRecordings = asyncHandler(async (req, res, next) => {
  const result = await query(`
    SELECT *
    FROM recorded_classes
    ORDER BY id DESC
  `);

  res.status(200).json({
    success: true,
    count: result.rows.length,
    data: result.rows
  });
});
