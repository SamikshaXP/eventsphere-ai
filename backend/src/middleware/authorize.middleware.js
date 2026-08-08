import Membership, { MEMBERSHIP_STATUS } from '../models/membership.model.js';
import ApiError from '../utils/ApiError.js';

export const requireOrgRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new ApiError(401, 'User must be authenticated');
      }

      const orgId =
        req.params.orgId ||
        req.params.organizationId ||
        req.query.orgId ||
        req.headers['x-organization-id'];

      if (!orgId) {
        throw new ApiError(400, 'Organization ID is required for role verification');
      }

      const membership = await Membership.findOne({
        user: req.user._id,
        organization: orgId,
        status: MEMBERSHIP_STATUS.ACTIVE
      });

      if (!membership) {
        throw new ApiError(403, 'Access denied: You do not have an active membership in this organization');
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(membership.role)) {
        throw new ApiError(403, 'Access denied: Insufficient organization role permissions');
      }

      req.membership = membership;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default requireOrgRole;
