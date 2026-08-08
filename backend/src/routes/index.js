import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import organizationRoutes from './organization.routes.js';
import userRegistrationRoutes from './userRegistration.routes.js';
import registrationRoutes from './registration.routes.js';
import ticketRoutes from './ticket.routes.js';

const router = Router();

router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/organizations', organizationRoutes);
router.use('/users', userRegistrationRoutes);
router.use('/registrations', registrationRoutes);
router.use('/tickets', ticketRoutes);

export default router;

