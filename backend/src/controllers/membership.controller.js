import mongoose from 'mongoose';
import User from '../models/user.model.js';
import Membership, { ROLES, MEMBERSHIP_STATUS } from '../models/membership.model.js';
import ApiError from '../utils/ApiError.js';

export const getMembers = async (req, res, next) => {
  try {
    const { organizationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      throw new ApiError(400, 'Invalid organization ID format');
    }

    const members = await Membership.find({ organization: organizationId })
      .populate('user', 'name email avatar isActive')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        members
      }
    });
  } catch (error) {
    next(error);
  }
};

export const addMember = async (req, res, next) => {
  try {
    const { organizationId } = req.params;
    const { email, role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      throw new ApiError(400, 'Invalid organization ID format');
    }

    if (!email || !email.trim()) {
      throw new ApiError(400, 'User email is required');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const targetUser = await User.findOne({ email: normalizedEmail });

    if (!targetUser) {
      throw new ApiError(404, 'User with this email does not exist');
    }

    const selectedRole = role || ROLES.PARTICIPANT;
    if (!Object.values(ROLES).includes(selectedRole)) {
      throw new ApiError(400, `Invalid membership role. Allowed roles: ${Object.values(ROLES).join(', ')}`);
    }

    const existingMembership = await Membership.findOne({
      user: targetUser._id,
      organization: organizationId
    });

    if (existingMembership) {
      throw new ApiError(409, 'User is already a member of this organization');
    }

    const membership = await Membership.create({
      user: targetUser._id,
      organization: organizationId,
      role: selectedRole,
      status: MEMBERSHIP_STATUS.ACTIVE
    });

    await membership.populate('user', 'name email avatar isActive');

    res.status(201).json({
      success: true,
      message: 'Member added successfully',
      data: {
        membership
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new ApiError(409, 'User is already a member of this organization'));
    }
    next(error);
  }
};

export const updateMember = async (req, res, next) => {
  try {
    const { organizationId, userId } = req.params;
    const { role, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      throw new ApiError(400, 'Invalid organization ID format');
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError(400, 'Invalid user ID format');
    }

    const membership = await Membership.findOne({
      user: userId,
      organization: organizationId
    });

    if (!membership) {
      throw new ApiError(404, 'Membership record not found');
    }

    const isDemotingAdmin =
      membership.role === ROLES.ADMIN &&
      role !== undefined &&
      role !== ROLES.ADMIN;

    const isDeactivatingAdmin =
      membership.role === ROLES.ADMIN &&
      status !== undefined &&
      status !== MEMBERSHIP_STATUS.ACTIVE;

    if (isDemotingAdmin || isDeactivatingAdmin) {
      const remainingAdmins = await Membership.countDocuments({
        organization: organizationId,
        role: ROLES.ADMIN,
        status: MEMBERSHIP_STATUS.ACTIVE,
        _id: { $ne: membership._id }
      });

      if (remainingAdmins === 0) {
        throw new ApiError(400, 'Cannot modify or demote the last active ADMIN of the organization');
      }
    }

    const updates = {};
    if (role !== undefined) {
      if (!Object.values(ROLES).includes(role)) {
        throw new ApiError(400, `Invalid membership role. Allowed roles: ${Object.values(ROLES).join(', ')}`);
      }
      updates.role = role;
    }

    if (status !== undefined) {
      if (!Object.values(MEMBERSHIP_STATUS).includes(status)) {
        throw new ApiError(400, `Invalid membership status. Allowed statuses: ${Object.values(MEMBERSHIP_STATUS).join(', ')}`);
      }
      updates.status = status;
    }

    const updatedMembership = await Membership.findByIdAndUpdate(
      membership._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('user', 'name email avatar isActive');

    res.status(200).json({
      success: true,
      message: 'Membership updated successfully',
      data: {
        membership: updatedMembership
      }
    });
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const { organizationId, userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      throw new ApiError(400, 'Invalid organization ID format');
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError(400, 'Invalid user ID format');
    }

    const membership = await Membership.findOne({
      user: userId,
      organization: organizationId
    });

    if (!membership) {
      throw new ApiError(404, 'Membership record not found');
    }

    if (membership.role === ROLES.ADMIN && membership.status === MEMBERSHIP_STATUS.ACTIVE) {
      const remainingAdmins = await Membership.countDocuments({
        organization: organizationId,
        role: ROLES.ADMIN,
        status: MEMBERSHIP_STATUS.ACTIVE,
        _id: { $ne: membership._id }
      });

      if (remainingAdmins === 0) {
        throw new ApiError(400, 'Cannot remove the last active ADMIN of the organization');
      }
    }

    await Membership.findByIdAndDelete(membership._id);

    res.status(200).json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    next(error);
  }
};
