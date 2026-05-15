import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { ensureImageDataUrl } from './authService.js';
import { buildTenantUrl, generateUniqueTenantDomain, normalizeTenantDomain } from '../utils/tenant.js';
import { rowToCamel, rowsToCamel } from '../utils/dbRow.js';

async function recordActivity({ action, userId, instituteId }) {
  try {
    await query(
      `INSERT INTO activity_logs (action, user_id, institute_id) VALUES ($1, $2, $3)`,
      [action, userId || null, instituteId || null]
    );
  } catch { /* best-effort */ }
}

function toPublicInstitute(row) {
  const inst = rowToCamel(row);
  inst.tenantUrl = inst.tenantDomain ? buildTenantUrl(inst.tenantDomain) : null;
  return inst;
}

async function createInstitute(data, { createdBySuperAdmin = false, actorId } = {}) {
  const status = createdBySuperAdmin ? 'ACTIVE' : 'PENDING';
  const name = data.instituteName || data.name;
  const email = data.email;
  const adminEmail = data.adminEmail || email;
  const adminPassword = data.adminPassword || data.password;
  const adminName = data.adminName || data.principalName || 'Institute Admin';

  if (!name || !email) throw { status: 400, message: 'Institute name and email are required.' };
  if (!adminEmail || !adminPassword) throw { status: 400, message: 'Admin email and password are required.' };

  const dup = await query(
    `SELECT id FROM users WHERE LOWER(email) = LOWER($1)
     UNION SELECT id FROM institutes WHERE LOWER(email) = LOWER($2) LIMIT 1`,
    [adminEmail, email]
  );
  if (dup.rows.length) throw { status: 400, message: 'Email is already in use.' };

  const tenantDomain = await generateUniqueTenantDomain(data.tenantDomain || name);
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const instResult = await query(
    `INSERT INTO institutes (
      name, principal_name, registration_no, email, phone, address,
      plot_no, street_name, land_mark, city, district, state, pin_code, logo, tenant_domain, status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
    RETURNING *`,
    [
      name, data.principalName || null, data.registrationNo || null, email,
      data.phone || null, data.address || null, data.plotNo || null, data.streetName || null,
      data.landMark || null, data.city || null, data.district || null, data.state || null,
      data.pinCode || null, data.logo ? ensureImageDataUrl(data.logo) : null, tenantDomain, status,
    ]
  );

  const institute = toPublicInstitute(instResult.rows[0]);

  await query(
    `INSERT INTO users (institute_id, name, email, password, role, is_active)
     VALUES ($1, $2, $3, $4, 'INSTITUTE_ADMIN', TRUE)`,
    [institute.id, adminName, adminEmail, hashedPassword]
  );

  await recordActivity({
    action: `${createdBySuperAdmin ? 'Super Admin created' : 'Institute registered'}: ${institute.name}`,
    userId: actorId,
    instituteId: institute.id,
  });

  return institute;
}

async function listInstitutes({ skip = 0, take = 20, status, search } = {}) {
  const conditions = [];
  const params = [];
  let n = 1;

  if (status && status !== 'ALL') {
    conditions.push(`status = $${n++}`);
    params.push(status);
  }
  if (search) {
    conditions.push(`(
      name ILIKE $${n} OR email ILIKE $${n} OR tenant_domain ILIKE $${n}
      OR city ILIKE $${n} OR state ILIKE $${n}
    )`);
    params.push(`%${search}%`);
    n++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query(`SELECT COUNT(*)::int AS count FROM institutes ${where}`, params);
  params.push(take, skip);
  const itemsResult = await query(
    `SELECT * FROM institutes ${where} ORDER BY created_at DESC LIMIT $${n} OFFSET $${n + 1}`,
    params
  );

  return {
    items: itemsResult.rows.map(toPublicInstitute),
    count: countResult.rows[0].count,
  };
}

async function getInstitute(id) {
  const result = await query(`SELECT * FROM institutes WHERE id = $1`, [id]);
  return result.rows[0] ? toPublicInstitute(result.rows[0]) : null;
}

async function getInstituteByTenant(tenantDomain) {
  const normalized = normalizeTenantDomain(tenantDomain);
  if (!normalized) return null;
  const result = await query(`SELECT * FROM institutes WHERE tenant_domain = $1`, [normalized]);
  return result.rows[0] ? toPublicInstitute(result.rows[0]) : null;
}

async function updateInstitute(id, data, actorId) {
  const fields = [];
  const params = [id];
  let n = 2;

  const map = {
    name: data.name || data.instituteName,
    principal_name: data.principalName,
    registration_no: data.registrationNo,
    email: data.email,
    phone: data.phone,
    address: data.address,
    status: data.status,
  };

  for (const [col, val] of Object.entries(map)) {
    if (val !== undefined) {
      fields.push(`${col} = $${n++}`);
      params.push(val);
    }
  }

  if (data.tenantDomain) {
    fields.push(`tenant_domain = $${n++}`);
    params.push(await generateUniqueTenantDomain(data.tenantDomain, id));
  }

  if (!fields.length) return getInstitute(id);

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  const result = await query(
    `UPDATE institutes SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
    params
  );

  await recordActivity({ action: `Institute updated`, userId: actorId, instituteId: id });
  return toPublicInstitute(result.rows[0]);
}

async function setInstituteStatus(id, status, actorId) {
  const result = await query(
    `UPDATE institutes SET status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
    [id, status]
  );
  await recordActivity({ action: `Institute ${status.toLowerCase()}`, userId: actorId, instituteId: id });
  return toPublicInstitute(result.rows[0]);
}

async function deleteInstitute(id) {
  await query(`DELETE FROM activity_logs WHERE institute_id = $1`, [id]);
  await query(`DELETE FROM complaints WHERE institute_id = $1`, [id]);
  await query(`DELETE FROM users WHERE institute_id = $1`, [id]);
  await query(`DELETE FROM institutes WHERE id = $1`, [id]);
}

export default {
  createInstitute,
  deleteInstitute,
  getInstitute,
  getInstituteByTenant,
  listInstitutes,
  setInstituteStatus,
  updateInstitute,
};
