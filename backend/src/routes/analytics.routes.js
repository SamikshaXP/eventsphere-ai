import { Router } from 'express';
import { getEventAnalytics, getEventInsights } from '../controllers/analytics.controller.js';
import authenticate from '../middleware/auth.middleware.js';
import requireOrgRole from '../middleware/authorize.middleware.js';
import { ROLES } from '../models/membership.model.js';

// Router with mergeParams: true mounted under /organizations/:organizationId/events/:eventId
const router = Router({ mergeParams: true });

// GET /api/v1/organizations/:organizationId/events/:eventId/analytics (ADMIN, ORGANIZER, VOLUNTEER)
router.get('/analytics', authenticate, requireOrgRole(ROLES.ADMIN, ROLES.ORGANIZER, ROLES.VOLUNTEER), getEventAnalytics);

// GET /api/v1/organizations/:organizationId/events/:eventId/insights (ADMIN, ORGANIZER only)
router.get('/insights', authenticate, requireOrgRole(ROLES.ADMIN, ROLES.ORGANIZER), getEventInsights);

export default router;
