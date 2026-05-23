import { getTenantDomainFromRequest } from '../utils/tenant.js';

function tenantMiddleware(req, _res, next) {
  req.tenantDomain = getTenantDomainFromRequest(req);
  next();
}

export default tenantMiddleware;
