import { Router } from 'express';
import {
  checkIn,
  checkOut,
  getEventAttendance,
  getAttendanceSummary
} from '../controllers/attendance.controller.js';
import authenticate from '../middleware/auth.middleware.js';
import requireOrgRole from '../middleware/authorize.middleware.js';
import { ROLES } from '../models/membership.model.js';

// Mounted under /organizations/:organizationId/events/:eventId/attendance
const router = Router({ mergeParams: true });

// Allowed roles for staff attendance operations: ADMIN, ORGANIZER, VOLUNTEER
const staffRoles = [ROLES.ADMIN, ROLES.ORGANIZER, ROLES.VOLUNTEER];

router.post('/check-in', authenticate, requireOrgRole(...staffRoles), checkIn);
router.post('/:attendanceId/check-out', authenticate, requireOrgRole(...staffRoles), checkOut);
router.get('/summary', authenticate, requireOrgRole(...staffRoles), getAttendanceSummary);
router.get('/', authenticate, requireOrgRole(...staffRoles), getEventAttendance);

export default router;
