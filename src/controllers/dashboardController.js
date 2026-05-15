import { query } from '../config/db.js';
import { rowToCamel } from '../utils/dbRow.js';
import { resolveInstituteId } from '../utils/instituteScope.js';

export async function stats(req, res, next) {
  try {
    const isInstituteAdmin = req.user?.role === 'INSTITUTE_ADMIN';
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';

    if (isInstituteAdmin) {
      const instituteId = await resolveInstituteId(req.user);
      const instRow = await query(`SELECT * FROM institutes WHERE id = $1`, [instituteId]);
      const currentInstitute = instRow.rows[0] ? rowToCamel(instRow.rows[0]) : null;

      const [teachers, students, openComplaints] = await Promise.all([
        query(`SELECT COUNT(*)::int AS c FROM users WHERE role = 'TEACHER' AND institute_id = $1`, [instituteId]),
        query(`SELECT COUNT(*)::int AS c FROM users WHERE role = 'STUDENT' AND institute_id = $1`, [instituteId]),
        query(`SELECT COUNT(*)::int AS c FROM complaints WHERE status = 'OPEN' AND institute_id = $1`, [instituteId]),
      ]);

      return res.json({
        currentInstitute,
        totalTeachers: teachers.rows[0].c,
        totalStudents: students.rows[0].c,
        openComplaints: openComplaints.rows[0].c,
        totalInstitutes: 1,
        pendingApprovals: 0,
      });
    }

    const [totalInstitutes, pendingApprovals, totalTeachers, totalStudents, openComplaints] =
      await Promise.all([
        query(`SELECT COUNT(*)::int AS c FROM institutes`),
        query(`SELECT COUNT(*)::int AS c FROM institutes WHERE status = 'PENDING'`),
        query(`SELECT COUNT(*)::int AS c FROM users WHERE role = 'TEACHER'`),
        query(`SELECT COUNT(*)::int AS c FROM users WHERE role = 'STUDENT'`),
        query(`SELECT COUNT(*)::int AS c FROM complaints WHERE status = 'OPEN'`),
      ]);

    res.json({
      totalInstitutes: totalInstitutes.rows[0].c,
      pendingApprovals: pendingApprovals.rows[0].c,
      totalTeachers: totalTeachers.rows[0].c,
      totalStudents: totalStudents.rows[0].c,
      openComplaints: openComplaints.rows[0].c,
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}
