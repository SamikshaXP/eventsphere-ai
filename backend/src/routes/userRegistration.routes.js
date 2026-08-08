import { Router } from 'express';
import { getMyRegistrations } from '../controllers/registration.controller.js';
import { getMyTickets } from '../controllers/ticket.controller.js';
import authenticate from '../middleware/auth.middleware.js';

const router = Router();

router.get('/me/registrations', authenticate, getMyRegistrations);
router.get('/me/tickets', authenticate, getMyTickets);

export default router;

