import { Router } from 'express';
import {
  createOrganization,
  getMyOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization
} from '../controllers/organization.controller.js';
import membershipRoutes from './membership.routes.js';
import eventRoutes from './event.routes.js';
import authenticate from '../middleware/auth.middleware.js';
import requireOrgRole from '../middleware/authorize.middleware.js';
import { ROLES } from '../models/membership.model.js';

const router = Router();

// Organization management endpoints
router.post('/', authenticate, createOrganization);
router.get('/', authenticate, getMyOrganizations);
router.get('/:organizationId', authenticate, requireOrgRole(), getOrganizationById);
router.patch('/:organizationId', authenticate, requireOrgRole(ROLES.ADMIN), updateOrganization);
router.delete('/:organizationId', authenticate, requireOrgRole(ROLES.ADMIN), deleteOrganization);

// Mount nested sub-resource routes
router.use('/:organizationId/members', membershipRoutes);
router.use('/:organizationId/events', eventRoutes);

export default router;
