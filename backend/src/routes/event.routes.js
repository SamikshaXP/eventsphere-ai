import { Router } from 'express';
import {
  createEvent,
  getOrganizationEvents,
  getEventById,
  updateEvent,
  publishEvent,
  cancelEvent,
  deleteEvent
} from '../controllers/event.controller.js';
import authenticate from '../middleware/auth.middleware.js';
import requireOrgRole from '../middleware/authorize.middleware.js';
import { ROLES } from '../models/membership.model.js';

// mergeParams: true allows accessing :organizationId from parent organization routes
const router = Router({ mergeParams: true });

router.post('/', authenticate, requireOrgRole(ROLES.ADMIN, ROLES.ORGANIZER), createEvent);
router.get('/', authenticate, requireOrgRole(), getOrganizationEvents);
router.get('/:eventId', authenticate, requireOrgRole(), getEventById);
router.patch('/:eventId', authenticate, requireOrgRole(ROLES.ADMIN, ROLES.ORGANIZER), updateEvent);
router.post('/:eventId/publish', authenticate, requireOrgRole(ROLES.ADMIN, ROLES.ORGANIZER), publishEvent);
router.post('/:eventId/cancel', authenticate, requireOrgRole(ROLES.ADMIN, ROLES.ORGANIZER), cancelEvent);
router.delete('/:eventId', authenticate, requireOrgRole(ROLES.ADMIN, ROLES.ORGANIZER), deleteEvent);

export default router;
