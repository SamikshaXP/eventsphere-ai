import { Router } from 'express';
import {
  registerForEvent,
  cancelRegistration,
  getRegistrationById,
  getEventRegistrations
} from '../controllers/registration.controller.js';
import authenticate from '../middleware/auth.middleware.js';
import requireOrgRole from '../middleware/authorize.middleware.js';
import { ROLES } from '../models/membership.model.js';

// Nested Router for /organizations/:organizationId/events/:eventId sub-routes & standalone /registrations routes
const router = Router({ mergeParams: true });

// Mounted under /organizations/:organizationId/events/:eventId
router.post('/register', authenticate, requireOrgRole(), registerForEvent);
router.get('/registrations', authenticate, requireOrgRole(ROLES.ADMIN, ROLES.ORGANIZER), getEventRegistrations);

// Standalone registration routes mounted under /registrations
router.get('/:registrationId', authenticate, getRegistrationById);
router.post('/:registrationId/cancel', authenticate, cancelRegistration);

export default router;

