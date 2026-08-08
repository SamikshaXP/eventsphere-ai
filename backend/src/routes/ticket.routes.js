import { Router } from 'express';
import { getTicketById } from '../controllers/ticket.controller.js';
import authenticate from '../middleware/auth.middleware.js';

const router = Router();

router.get('/:ticketId', authenticate, getTicketById);

export default router;

