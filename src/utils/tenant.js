import { query } from '../config/db.js';

const RESERVED_TENANTS = new Set(['app', 'api', 'admin', 'super-admin', 'www', 'localhost']);

export function normalizeTenantDomain(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/:\d+$/, '')
    .split('.')[0]
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || null;
}

export function slugifyTenantDomain(value) {
  const slug = String(value || 'institute')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 44);
  const safeSlug = slug || 'institute';
  return RESERVED_TENANTS.has(safeSlug) ? `${safeSlug}-school` : safeSlug;
}

export async function generateUniqueTenantDomain(value, ignoreInstituteId) {
  const base = slugifyTenantDomain(value);
  let candidate = base;
  let suffix = 1;

  while (true) {
    const params = [candidate];
    let sql = `SELECT id FROM institutes WHERE tenant_domain = $1`;
    if (ignoreInstituteId) {
      sql += ` AND id != $2`;
      params.push(ignoreInstituteId);
    }
    const result = await query(sql, params);
    if (!result.rows.length) break;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  return candidate;
}

function tenantFromHost(hostname) {
  const host = String(hostname || '').toLowerCase().replace(/:\d+$/, '');
  if (!host || host === 'localhost' || host === '127.0.0.1' || host === '::1') return null;
  if (host.endsWith('.localhost')) {
    return normalizeTenantDomain(host.replace(/\.localhost$/, ''));
  }
  const parts = host.split('.');
  if (parts.length >= 3 && parts[0] !== 'www') {
    return normalizeTenantDomain(parts[0]);
  }
  return null;
}

export function getTenantDomainFromRequest(req) {
  const explicitTenant = normalizeTenantDomain(req.headers['x-tenant-domain']);
  if (explicitTenant) return explicitTenant;

  const origin = req.headers.origin || req.headers.referer;
  if (origin) {
    try {
      const parsed = new URL(origin);
      const tenantFromOrigin = tenantFromHost(parsed.hostname);
      if (tenantFromOrigin) return tenantFromOrigin;
    } catch {
      const tenantFromOrigin = tenantFromHost(origin);
      if (tenantFromOrigin) return tenantFromOrigin;
    }
  }

  return tenantFromHost(req.headers.host);
}

export function buildTenantUrl(tenantDomain, baseHost = 'localhost:8080') {
  const domain = normalizeTenantDomain(tenantDomain);
  return domain ? `http://${domain}.${baseHost}` : null;
}
