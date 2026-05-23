import { query } from '../config/db.js';

/** Resolve institute for institute admin, super admin (body), or first active institute */
export async function resolveInstituteId(user, bodyInstituteId) {
  if (user?.role === 'INSTITUTE_ADMIN') {
    if (!user.instituteId) {
      throw { status: 400, message: 'Your account is not linked to an institute.' };
    }
    return user.instituteId;
  }

  if (bodyInstituteId) {
    const check = await query(`SELECT id FROM institutes WHERE id = $1`, [bodyInstituteId]);
    if (!check.rows.length) throw { status: 404, message: 'Institute not found' };
    return bodyInstituteId;
  }

  if (user?.instituteId) return user.instituteId;

  const fallback = await query(
    `SELECT id FROM institutes WHERE status = 'ACTIVE' ORDER BY created_at ASC LIMIT 1`
  );
  if (fallback.rows.length) return fallback.rows[0].id;

  throw { status: 400, message: 'No active institute found. Create or approve an institute first.' };
}
