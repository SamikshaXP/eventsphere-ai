import { Router } from 'express';
import {
  getMembers,
  addMember,
  updateMember,
  removeMember
} from '../controllers/membership.controller.js';
import authenticate from '../middleware/auth.middleware.js';
import requireOrgRole from '../middleware/authorize.middleware.js';
import { ROLES } from '../models/membership.model.js';

// { mergeParams: true } allows accessing :organizationId from parent organization routes
const router = Router({ mergeParams: true });

router.get('/', authenticate, requireOrgRole(ROLES.ADMIN, ROLES.ORGANIZER), getMembers);
router.post('/', authenticate, requireOrgRole(ROLES.ADMIN), addMember);
router.patch('/:userId', authenticate, requireOrgRole(ROLES.ADMIN), updateMember);
router.delete('/:userId', authenticate, requireOrgRole(ROLES.ADMIN), removeMember);

export default router;
