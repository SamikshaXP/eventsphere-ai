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
import registrationRoutes from './registration.routes.js';
import attendanceRoutes from './attendance.routes.js';
import analyticsRoutes from './analytics.routes.js';
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

// Mount nested attendance sub-routes under /:eventId/attendance
router.use('/:eventId/attendance', attendanceRoutes);

// Mount nested analytics & AI insight sub-routes under /:eventId
router.use('/:eventId', analyticsRoutes);

// Mount nested registration sub-routes under /:eventId
router.use('/:eventId', registrationRoutes);

export default router;
