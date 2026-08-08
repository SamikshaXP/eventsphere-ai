import mongoose from 'mongoose';

export const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  ORGANIZER: 'ORGANIZER',
  VOLUNTEER: 'VOLUNTEER',
  PARTICIPANT: 'PARTICIPANT',
  SPONSOR: 'SPONSOR'
});

export const MEMBERSHIP_STATUS = Object.freeze({
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE'
});

const membershipSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization reference is required'],
      index: true
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.PARTICIPANT,
      required: true
    },
    status: {
      type: String,
      enum: Object.values(MEMBERSHIP_STATUS),
      default: MEMBERSHIP_STATUS.ACTIVE,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Compound Unique Index: Enforces membership uniqueness per user per organization
membershipSchema.index({ user: 1, organization: 1 }, { unique: true });

export const Membership = mongoose.model('Membership', membershipSchema);
export default Membership;
