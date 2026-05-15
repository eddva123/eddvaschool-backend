import instituteService from '../services/instituteService.js';

export async function createInstitute(req, res, next) {
  try {
    const institute = await instituteService.createInstitute(req.body, {
      createdBySuperAdmin: req.user?.role === 'SUPER_ADMIN',
      actorId: req.user?.id,
    });
    res.status(201).json(institute);
  } catch (err) {
    next(err);
  }
}

export async function listInstitutes(req, res, next) {
  try {
    const { page = 1, perPage = 20, status, search } = req.query;
    const skip = (Number(page) - 1) * Number(perPage);
    const result = await instituteService.listInstitutes({ skip, take: Number(perPage), status, search });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getInstitute(req, res, next) {
  try {
    const inst = await instituteService.getInstitute(req.params.id);
    if (!inst) return res.status(404).json({ error: 'Institute not found' });
    res.json(inst);
  } catch (err) {
    next(err);
  }
}

export async function getInstituteByTenant(req, res, next) {
  try {
    const tenant = req.params.tenantDomain || req.tenantDomain;
    const inst = await instituteService.getInstituteByTenant(tenant);
    if (!inst) return res.status(404).json({ error: 'Tenant not found' });
    res.json(inst);
  } catch (err) {
    next(err);
  }
}

export async function getCurrentTenantInstitute(req, res, next) {
  try {
    const tenant = req.tenantDomain || req.user?.institute?.tenantDomain;
    const inst = await instituteService.getInstituteByTenant(tenant);
    if (!inst) return res.status(404).json({ error: 'Tenant not found' });
    res.json(inst);
  } catch (err) {
    next(err);
  }
}

export async function updateInstitute(req, res, next) {
  try {
    const inst = await instituteService.updateInstitute(req.params.id, req.body, req.user?.id);
    res.json(inst);
  } catch (err) {
    next(err);
  }
}

export async function approveInstitute(req, res, next) {
  try {
    const inst = await instituteService.setInstituteStatus(req.params.id, 'ACTIVE', req.user?.id);
    res.json({ message: 'Institute approved successfully', institute: inst });
  } catch (err) {
    next(err);
  }
}

export async function rejectInstitute(req, res, next) {
  try {
    const inst = await instituteService.setInstituteStatus(req.params.id, 'SUSPENDED', req.user?.id);
    res.json({ message: 'Institute suspended', institute: inst });
  } catch (err) {
    next(err);
  }
}

export async function deleteInstitute(req, res, next) {
  try {
    await instituteService.deleteInstitute(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
