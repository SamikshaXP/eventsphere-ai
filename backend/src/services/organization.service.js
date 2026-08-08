import mongoose from 'mongoose';
import Organization from '../models/organization.model.js';
import Membership, { ROLES, MEMBERSHIP_STATUS } from '../models/membership.model.js';
import ApiError from '../utils/ApiError.js';

export const createOrganizationWithAdmin = async ({ name, description, logo, ownerId }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const orgs = await Organization.create(
      [
        {
          name: name.trim(),
          description: description ? description.trim() : '',
          logo: logo || '',
          owner: ownerId
        }
      ],
      { session }
    );

    const organization = orgs[0];

    const memberships = await Membership.create(
      [
        {
          user: ownerId,
          organization: organization._id,
          role: ROLES.ADMIN,
          status: MEMBERSHIP_STATUS.ACTIVE
        }
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return {
      organization,
      membership: memberships[0]
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    if (error.code === 11000) {
      throw new ApiError(409, 'User is already a member of this organization');
    }
    throw error;
  }
};

export default {
  createOrganizationWithAdmin
};
