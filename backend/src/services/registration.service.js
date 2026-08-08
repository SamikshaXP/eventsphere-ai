import crypto from 'crypto';
import mongoose from 'mongoose';
import Registration, { REGISTRATION_STATUS } from '../models/registration.model.js';
import Ticket, { TICKET_STATUS, TICKET_TYPE } from '../models/ticket.model.js';
import Event, { EVENT_STATUS } from '../models/event.model.js';
import Organization from '../models/organization.model.js';
import Membership, { MEMBERSHIP_STATUS, ROLES } from '../models/membership.model.js';
import ApiError from '../utils/ApiError.js';

const generateTicketNumber = () => {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `EVT-${year}-${timestamp}-${randomPart}`;
};

const generateQrToken = () => {
  return `QR-${crypto.randomBytes(16).toString('hex').toUpperCase()}`;
};

export const registerForEventService = async ({ organizationId, eventId, userId, ticketType }) => {
  if (!mongoose.Types.ObjectId.isValid(organizationId)) {
    throw new ApiError(400, 'Invalid organization ID format');
  }

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw new ApiError(400, 'Invalid event ID format');
  }

  // 1. Verify user membership in organization
  const membership = await Membership.findOne({
    user: userId,
    organization: organizationId,
    status: MEMBERSHIP_STATUS.ACTIVE
  });

  if (!membership) {
    throw new ApiError(403, 'Access denied: You must be an active member of the organization to register for events');
  }

  // 2. Verify event exists in organization
  const event = await Event.findOne({ _id: eventId, organization: organizationId });
  if (!event) {
    throw new ApiError(404, 'Event not found in this organization');
  }

  // 3. Verify event status
  if (event.status === EVENT_STATUS.DRAFT) {
    throw new ApiError(400, 'Cannot register for a DRAFT event');
  }
  if (event.status === EVENT_STATUS.CANCELLED) {
    throw new ApiError(400, 'Cannot register for a CANCELLED event');
  }
  if (event.status === EVENT_STATUS.COMPLETED) {
    throw new ApiError(400, 'Cannot register for a COMPLETED event');
  }
  if (event.status === EVENT_STATUS.ONGOING) {
    throw new ApiError(400, 'Cannot register for an ONGOING event');
  }
  if (event.status !== EVENT_STATUS.PUBLISHED) {
    throw new ApiError(400, `Cannot register for an event with status ${event.status}`);
  }

  // Verify ticket type if provided
  let selectedType = TICKET_TYPE.STANDARD;
  if (ticketType !== undefined && ticketType !== null && ticketType !== '') {
    if (!Object.values(TICKET_TYPE).includes(ticketType)) {
      throw new ApiError(400, `Invalid ticket type '${ticketType}'. Valid types: ${Object.values(TICKET_TYPE).join(', ')}`);
    }
    selectedType = ticketType;
  }

  // 4. Verify registration window
  const now = new Date();
  if (event.registrationStart && now < new Date(event.registrationStart)) {
    throw new ApiError(400, 'Registration has not opened yet for this event');
  }
  if (event.registrationEnd && now > new Date(event.registrationEnd)) {
    throw new ApiError(400, 'Registration window has closed for this event');
  }

  // 5. Verify no duplicate registration
  const existingRegistration = await Registration.findOne({ event: eventId, user: userId });
  if (existingRegistration) {
    throw new ApiError(409, 'User is already registered for this event');
  }

  // 6. Execute atomic Registration + Ticket creation transaction with retry logic for write conflicts
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    attempts++;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Acquire lock on Event to serialize capacity evaluation for concurrent registrations
      await Event.findOneAndUpdate({ _id: eventId }, { $set: { updatedAt: new Date() } }, { session });

      const confirmedCount = await Registration.countDocuments({
        event: eventId,
        status: REGISTRATION_STATUS.CONFIRMED
      }).session(session);

      let regStatus = REGISTRATION_STATUS.CONFIRMED;
      let isWaitlisted = false;

      if (event.capacity && event.capacity > 0 && confirmedCount >= event.capacity) {
        regStatus = REGISTRATION_STATUS.WAITLISTED;
        isWaitlisted = true;
      }

      const [registration] = await Registration.create(
        [
          {
            event: eventId,
            user: userId,
            organization: organizationId,
            status: regStatus
          }
        ],
        { session }
      );

      let ticket = null;
      if (!isWaitlisted) {
        const ticketNumber = generateTicketNumber();
        const qrToken = generateQrToken();

        const [createdTicket] = await Ticket.create(
          [
            {
              registration: registration._id,
              event: eventId,
              user: userId,
              ticketNumber,
              qrToken,
              ticketType: selectedType,
              status: TICKET_STATUS.ACTIVE
            }
          ],
          { session }
        );

        ticket = createdTicket;
        registration.ticket = ticket._id;
        await registration.save({ session });
      }

      await session.commitTransaction();
      session.endSession();

      await registration.populate([
        { path: 'event', select: 'title startDate endDate locationType venue onlineLink category' },
        { path: 'organization', select: 'name logo' },
        { path: 'ticket' }
      ]);

      return {
        registration,
        ticket,
        isWaitlisted
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      const isTransientError =
        error.errorLabels?.includes('TransientTransactionError') ||
        error.codeName === 'WriteConflict' ||
        error.code === 112;

      if (isTransientError && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 50 + 10));
        continue;
      }

      if (error.code === 11000) {
        throw new ApiError(409, 'User is already registered for this event');
      }
      throw error;
    }
  }
};

export const cancelRegistrationService = async ({ registrationId, userId }) => {
  if (!mongoose.Types.ObjectId.isValid(registrationId)) {
    throw new ApiError(400, 'Invalid registration ID format');
  }

  const registration = await Registration.findById(registrationId);
  if (!registration) {
    throw new ApiError(404, 'Registration not found');
  }

  // User must own the registration or be ADMIN/ORGANIZER in org
  const orgId = registration.organization._id || registration.organization;
  if (registration.user.toString() !== userId.toString()) {
    const membership = await Membership.findOne({
      user: userId,
      organization: orgId,
      status: MEMBERSHIP_STATUS.ACTIVE,
      role: { $in: [ROLES.ADMIN, ROLES.ORGANIZER] }
    });

    if (!membership) {
      throw new ApiError(403, 'Access denied: You can only cancel your own registration');
    }
  }

  if (registration.status === REGISTRATION_STATUS.CANCELLED) {
    throw new ApiError(400, 'Registration is already cancelled');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    registration.status = REGISTRATION_STATUS.CANCELLED;
    registration.cancelledAt = new Date();
    await registration.save({ session });

    if (registration.ticket) {
      await Ticket.findByIdAndUpdate(
        registration.ticket,
        { status: TICKET_STATUS.CANCELLED },
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }

  return registration.populate([
    { path: 'event', select: 'title startDate endDate locationType' },
    { path: 'ticket' }
  ]);
};

export const getMyRegistrationsService = async ({ userId }) => {
  return Registration.find({ user: userId })
    .populate('event', 'title startDate endDate locationType venue onlineLink status bannerImage category')
    .populate('organization', 'name logo')
    .populate('ticket')
    .sort({ createdAt: -1 });
};

export const getRegistrationByIdService = async ({ registrationId, userId }) => {
  if (!mongoose.Types.ObjectId.isValid(registrationId)) {
    throw new ApiError(400, 'Invalid registration ID format');
  }

  const registration = await Registration.findById(registrationId).populate([
    { path: 'event', select: 'title startDate endDate locationType venue onlineLink status category' },
    { path: 'organization', select: 'name logo' },
    { path: 'user', select: 'name email avatar' },
    { path: 'ticket' }
  ]);

  if (!registration) {
    throw new ApiError(404, 'Registration not found');
  }

  if (registration.user._id.toString() !== userId.toString()) {
    const membership = await Membership.findOne({
      user: userId,
      organization: registration.organization._id,
      status: MEMBERSHIP_STATUS.ACTIVE,
      role: { $in: [ROLES.ADMIN, ROLES.ORGANIZER] }
    });

    if (!membership) {
      throw new ApiError(403, 'Access denied: You do not have permission to view this registration');
    }
  }

  return registration;
};

export const getEventRegistrationsService = async ({ organizationId, eventId }) => {
  if (!mongoose.Types.ObjectId.isValid(organizationId)) {
    throw new ApiError(400, 'Invalid organization ID format');
  }

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw new ApiError(400, 'Invalid event ID format');
  }

  const event = await Event.findOne({ _id: eventId, organization: organizationId });
  if (!event) {
    throw new ApiError(404, 'Event not found in this organization');
  }

  return Registration.find({ event: eventId, organization: organizationId })
    .populate('user', 'name email avatar isActive')
    .populate('ticket')
    .sort({ createdAt: -1 });
};
