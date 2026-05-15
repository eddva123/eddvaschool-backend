import express from 'express';
import {
  createInstitute, listInstitutes, getInstitute, getInstituteByTenant,
  getCurrentTenantInstitute, updateInstitute, approveInstitute, rejectInstitute, deleteInstitute,
} from '../controllers/instituteController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/tenant/current', getCurrentTenantInstitute);
router.get('/tenant/:tenantDomain', getInstituteByTenant);

router.post('/', protect, authorize('SUPER_ADMIN'), createInstitute);
router.get('/', protect, authorize('SUPER_ADMIN'), listInstitutes);
router.get('/:id', protect, authorize('SUPER_ADMIN'), getInstitute);
router.put('/:id', protect, authorize('SUPER_ADMIN'), updateInstitute);
router.put('/:id/approve', protect, authorize('SUPER_ADMIN'), approveInstitute);
router.put('/:id/reject', protect, authorize('SUPER_ADMIN'), rejectInstitute);
router.delete('/:id', protect, authorize('SUPER_ADMIN'), deleteInstitute);

export default router;
