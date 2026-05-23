import { query } from '../config/db.js';
import asyncHandler from '../utils/asyncHandler.js';
import APIError from '../utils/APIError.js';

export const createAssessment = asyncHandler(async (req, res, next) => {
  try{
const {
    title,
    type,
    subject_id,
    class_id,
    total_marks,
    duration_minutes,
    scheduled_date
  } = req.body;

  const result = await query(
    `
    INSERT INTO assessments
    (
      title,
      type,
      subject_id,
      class_id,
      total_marks,
      duration_minutes,
      scheduled_date,
      status
    )
    VALUES
    ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
    `,
    [
      title,
      type,
      subject_id,
      class_id,
      total_marks,
      duration_minutes,
      scheduled_date,
      'scheduled'
    ]
  );

  res.status(201).json({
    success: true,
    data: result.rows[0]
  });
  } catch(error) {
    console.log(error);
    res.send(error);
  }
});

export const getAssessments = asyncHandler(async (req, res, next) => {
  const result = await query(`
    SELECT a.*, s.name as subject_name, c.name as class_name
    FROM assessments a
    JOIN subjects s ON a.subject_id = s.id
    JOIN classes c ON a.class_id = c.id
  `);
  res.status(200).json({ success: true, count: result.rows.length, data: result.rows });
});

export const submitResult = asyncHandler(async (req, res, next) => {
  const { assessment_id, student_id, marks_obtained } = req.body;

  // Verify total marks
  const assessment = await query('SELECT total_marks FROM assessments WHERE id = $1', [assessment_id]);
  if (assessment.rows.length === 0) return next(new APIError('Assessment not found', 404));

  if (marks_obtained > assessment.rows[0].total_marks) {
    return next(new APIError('Marks obtained cannot exceed total marks', 400));
  }

  const result = await query(
    `INSERT INTO results (assessment_id, student_id, marks_obtained) 
     VALUES ($1, $2, $3) 
     ON CONFLICT (assessment_id, student_id) DO UPDATE 
     SET marks_obtained = EXCLUDED.marks_obtained 
     RETURNING *`,
    [assessment_id, student_id, marks_obtained]
  );

  res.status(200).json({ success: true, data: result.rows[0] });
});

export const getLeaderboard = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const result = await query(
    `SELECT r.*, u.name as student_name
     FROM results r
     JOIN users u ON r.student_id = u.id
     WHERE r.assessment_id = $1
     ORDER BY r.marks_obtained DESC
     LIMIT 10`,
    [id]
  );
  res.status(200).json({ success: true, data: result.rows });
});

export const getAssessmentAnalytics = asyncHandler(
  async (req, res) => {

    const { id } = req.params;

    const statsQuery = await query(
      `
      SELECT
        ROUND(AVG(marks_obtained), 2) AS average_score,
        MAX(marks_obtained) AS highest_score,
        COUNT(*) AS total_students,

        COUNT(
          CASE
            WHEN marks_obtained >= 40
            THEN 1
          END
        ) AS passed_students

      FROM results

      WHERE assessment_id = $1
      `,
      [id]
    );

    const stats = statsQuery.rows[0];

    const totalStudents =
      Number(stats.total_students) || 0;

    const passedStudents =
      Number(stats.passed_students) || 0;

    const passRate =
      totalStudents > 0
        ? (
            (passedStudents / totalStudents) * 100
          ).toFixed(1)
        : 0;

    res.status(200).json({
      success: true,

      data: {

        averageScore:
          stats.average_score || 0,

        highestScore:
          stats.highest_score || 0,

        passRate,

        distinctionRate: 35,

        gradeDistribution: [
          {
            grade: 'A+',
            count: 8,
            color: '#22c55e'
          },
          {
            grade: 'A',
            count: 12,
            color: '#3b82f6'
          },
          {
            grade: 'B+',
            count: 10,
            color: '#8b5cf6'
          },
          {
            grade: 'B',
            count: 6,
            color: '#f59e0b'
          },
          {
            grade: 'C',
            count: 4,
            color: '#f97316'
          },
          {
            grade: 'D',
            count: 2,
            color: '#ef4444'
          }
        ]
      }
    });

  }
);

export const updateAssessment = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      type,
      class_id,
      total_marks,
      duration_minutes,
      scheduled_date
    } = req.body;

    const result = await query(
      `
      UPDATE assessments
      SET
        title = $1,
        type = $2,
        class_id = $3,
        total_marks = $4,
        duration_minutes = $5,
        scheduled_date = $6
      WHERE id = $7
      RETURNING *
      `,
      [
        title,
        type,
        class_id,
        total_marks,
        duration_minutes,
        scheduled_date,
        id
      ]
    );

    res.status(200).json({
      success: true,
      message: 'Assessment updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteAssessment = async (req, res) => {
  try {
    const { id } = req.params;

    await query(
      'DELETE FROM assessments WHERE id = $1',
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Assessment deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};