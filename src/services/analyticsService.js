import { query } from '../config/db.js';

export const getStudentPerformance = async (studentId) => {
  const results = await query(
    `SELECT r.*, a.title, a.date, a.total_marks
     FROM results r
     JOIN assessments a ON r.assessment_id = a.id
     WHERE r.student_id = $1
     ORDER BY a.date DESC`,
    [studentId]
  );

  const stats = await query(
    `SELECT AVG(marks_obtained::float / total_marks::float * 100) as average_percentage
     FROM results r
     JOIN assessments a ON r.assessment_id = a.id
     WHERE r.student_id = $1`,
    [studentId]
  );

  return {
    history: results.rows,
    average: stats.rows[0].average_percentage || 0
  };
};

export const getClassAnalytics = async (classId) => {
  const stats = await query(
    `SELECT a.title, AVG(r.marks_obtained::float / a.total_marks::float * 100) as avg_score
     FROM assessments a
     JOIN results r ON a.id = r.assessment_id
     WHERE a.class_id = $1
     GROUP BY a.id, a.title, a.date
     ORDER BY a.date ASC`,
    [classId]
  );

  return stats.rows;
};
