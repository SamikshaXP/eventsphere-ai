import mongoose from 'mongoose';
import Ticket from '../models/ticket.model.js';
import Membership, { MEMBERSHIP_STATUS, ROLES } from '../models/membership.model.js';
import ApiError from '../utils/ApiError.js';

export const getMyTicketsService = async ({ userId }) => {
  return Ticket.find({ user: userId })
    .populate('event', 'title startDate endDate locationType venue onlineLink category status bannerImage')
    .populate('registration')
    .sort({ createdAt: -1 });
};

export const getTicketByIdService = async ({ ticketId, userId }) => {
  if (!mongoose.Types.ObjectId.isValid(ticketId)) {
    throw new ApiError(400, 'Invalid ticket ID format');
  }

  const ticket = await Ticket.findById(ticketId)
    .populate('event', 'title startDate endDate locationType venue onlineLink organization status')
    .populate('user', 'name email avatar')
    .populate('registration');

  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }

  if (ticket.user._id.toString() !== userId.toString()) {
    const membership = await Membership.findOne({
      user: userId,
      organization: ticket.event.organization,
      status: MEMBERSHIP_STATUS.ACTIVE,
      role: { $in: [ROLES.ADMIN, ROLES.ORGANIZER] }
    });

    if (!membership) {
      throw new ApiError(403, 'Access denied: You do not have permission to view this ticket');
    }
  }

  return ticket;
};
