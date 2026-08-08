import mongoose from 'mongoose';
import Organization from '../models/organization.model.js';
import Membership, { MEMBERSHIP_STATUS } from '../models/membership.model.js';
import { createOrganizationWithAdmin } from '../services/organization.service.js';
import ApiError from '../utils/ApiError.js';

export const createOrganization = async (req, res, next) => {
  try {
    const { name, description, logo } = req.body;

    if (!name || !name.trim()) {
      throw new ApiError(400, 'Organization name is required');
    }

    if (name.trim().length > 150) {
      throw new ApiError(400, 'Organization name cannot exceed 150 characters');
    }

    const result = await createOrganizationWithAdmin({
      name: name.trim(),
      description,
      logo,
      ownerId: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getMyOrganizations = async (req, res, next) => {
  try {
    const memberships = await Membership.find({
      user: req.user._id,
      status: MEMBERSHIP_STATUS.ACTIVE
    }).populate('organization');

    const result = memberships
      .filter((m) => m.organization != null)
      .map((m) => ({
        organization: m.organization,
        role: m.role,
        status: m.status,
        joinedAt: m.createdAt
      }));

    res.status(200).json({
      success: true,
      data: {
        organizations: result
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getOrganizationById = async (req, res, next) => {
  try {
    const { organizationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      throw new ApiError(400, 'Invalid organization ID format');
    }

    const organization = await Organization.findById(organizationId).populate('owner', 'name email avatar');
    if (!organization) {
      throw new ApiError(404, 'Organization not found');
    }

    res.status(200).json({
      success: true,
      data: {
        organization,
        userRole: req.membership ? req.membership.role : null,
        membership: req.membership
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrganization = async (req, res, next) => {
  try {
    const { organizationId } = req.params;
    const { name, description, logo } = req.body;

    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      throw new ApiError(400, 'Invalid organization ID format');
    }

    const updates = {};
    if (name !== undefined) {
      if (!name || !name.trim()) {
        throw new ApiError(400, 'Organization name cannot be empty');
      }
      if (name.trim().length > 150) {
        throw new ApiError(400, 'Organization name cannot exceed 150 characters');
      }
      updates.name = name.trim();
    }

    if (description !== undefined) {
      updates.description = description ? description.trim() : '';
    }

    if (logo !== undefined) {
      updates.logo = logo || '';
    }

    const updatedOrg = await Organization.findByIdAndUpdate(
      organizationId,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('owner', 'name email avatar');

    if (!updatedOrg) {
      throw new ApiError(404, 'Organization not found');
    }

    res.status(200).json({
      success: true,
      message: 'Organization updated successfully',
      data: {
        organization: updatedOrg
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteOrganization = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { organizationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      throw new ApiError(400, 'Invalid organization ID format');
    }

    const organization = await Organization.findById(organizationId).session(session);
    if (!organization) {
      throw new ApiError(404, 'Organization not found');
    }

    await Membership.deleteMany({ organization: organizationId }).session(session);
    await Organization.findByIdAndDelete(organizationId).session(session);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Organization and associated memberships deleted successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};
