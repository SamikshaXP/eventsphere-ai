import mongoose from 'mongoose';
import Attendance, { ATTENDANCE_STATUS } from '../models/attendance.model.js';
import Ticket, { TICKET_STATUS } from '../models/ticket.model.js';
import Registration, { REGISTRATION_STATUS } from '../models/registration.model.js';
import Event, { EVENT_STATUS } from '../models/event.model.js';
import ApiError from '../utils/ApiError.js';

export const checkInService = async ({ organizationId, eventId, qrToken, checkedInByUserId }) => {
  if (!mongoose.Types.ObjectId.isValid(organizationId)) {
    throw new ApiError(400, 'Invalid organization ID format');
  }

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw new ApiError(400, 'Invalid event ID format');
  }

  if (!qrToken || typeof qrToken !== 'string' || qrToken.trim() === '') {
    throw new ApiError(400, 'Check-in token or QR token is required');
  }

  const cleanToken = qrToken.trim();

  // 1. Verify event exists in organization
  const event = await Event.findOne({ _id: eventId, organization: organizationId });
  if (!event) {
    throw new ApiError(404, 'Event not found in this organization');
  }

  // 2. Verify event status (DRAFT, CANCELLED, COMPLETED -> reject)
  if (event.status === EVENT_STATUS.DRAFT) {
    throw new ApiError(400, 'Cannot perform check-in for a DRAFT event');
  }
  if (event.status === EVENT_STATUS.CANCELLED) {
    throw new ApiError(400, 'Cannot perform check-in for a CANCELLED event');
  }
  if (event.status === EVENT_STATUS.COMPLETED) {
    throw new ApiError(400, 'Cannot perform check-in for a COMPLETED event');
  }
  if (![EVENT_STATUS.PUBLISHED, EVENT_STATUS.ONGOING].includes(event.status)) {
    throw new ApiError(400, `Cannot perform check-in for event with status ${event.status}`);
  }

  // 3. Find ticket by qrToken or ticketNumber
  const ticket = await Ticket.findOne({
    $or: [{ qrToken: cleanToken }, { ticketNumber: cleanToken }]
  }).populate('registration');

  if (!ticket) {
    throw new ApiError(404, 'Invalid or unknown check-in token');
  }

  // 4. Verify ticket belongs to requested event
  if (ticket.event.toString() !== eventId.toString()) {
    throw new ApiError(400, 'Ticket does not belong to this event');
  }

  // 5. Verify ticket status is ACTIVE
  if (ticket.status !== TICKET_STATUS.ACTIVE) {
    throw new ApiError(400, 'Ticket is cancelled or inactive');
  }

  // 6. Verify registration exists and is CONFIRMED
  if (!ticket.registration || ticket.registration.status !== REGISTRATION_STATUS.CONFIRMED) {
    throw new ApiError(400, 'Registration is not confirmed for this ticket');
  }

  // 7. Check for existing attendance record
  const existingAttendance = await Attendance.findOne({ ticket: ticket._id });
  if (existingAttendance) {
    throw new ApiError(409, 'Ticket has already been checked in');
  }

  // 8. Execute atomic Attendance creation transaction with retry logic for write conflicts
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    attempts++;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const doubleCheck = await Attendance.findOne({ ticket: ticket._id }).session(session);
      if (doubleCheck) {
        throw new ApiError(409, 'Ticket has already been checked in');
      }

      const [attendance] = await Attendance.create(
        [
          {
            event: eventId,
            organization: organizationId,
            registration: ticket.registration._id,
            ticket: ticket._id,
            user: ticket.user,
            status: ATTENDANCE_STATUS.CHECKED_IN,
            checkInAt: new Date(),
            checkedInBy: checkedInByUserId
          }
        ],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return attendance.populate([
        { path: 'user', select: 'name email avatar' },
        { path: 'event', select: 'title startDate endDate' },
        { path: 'ticket', select: 'ticketNumber ticketType status' },
        { path: 'checkedInBy', select: 'name email' }
      ]);
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
        throw new ApiError(409, 'Ticket has already been checked in');
      }
      throw error;
    }
  }
};

export const checkOutService = async ({ organizationId, eventId, attendanceId, checkedOutByUserId }) => {
  if (!mongoose.Types.ObjectId.isValid(organizationId)) {
    throw new ApiError(400, 'Invalid organization ID format');
  }

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw new ApiError(400, 'Invalid event ID format');
  }

  if (!mongoose.Types.ObjectId.isValid(attendanceId)) {
    throw new ApiError(400, 'Invalid attendance ID format');
  }

  const attendance = await Attendance.findById(attendanceId);
  if (!attendance) {
    throw new ApiError(404, 'Attendance record not found');
  }

  if (attendance.event.toString() !== eventId.toString() || attendance.organization.toString() !== organizationId.toString()) {
    throw new ApiError(403, 'Attendance record does not belong to this event or organization');
  }

  if (attendance.status === ATTENDANCE_STATUS.CHECKED_OUT) {
    throw new ApiError(400, 'Attendance record is already checked out');
  }

  attendance.status = ATTENDANCE_STATUS.CHECKED_OUT;
  attendance.checkOutAt = new Date();
  attendance.checkedOutBy = checkedOutByUserId;

  await attendance.save();

  return attendance.populate([
    { path: 'user', select: 'name email avatar' },
    { path: 'event', select: 'title startDate endDate' },
    { path: 'ticket', select: 'ticketNumber ticketType' },
    { path: 'checkedInBy', select: 'name email' },
    { path: 'checkedOutBy', select: 'name email' }
  ]);
};

export const getMyAttendanceService = async ({ userId }) => {
  return Attendance.find({ user: userId })
    .populate('event', 'title startDate endDate locationType venue category status bannerImage')
    .populate('organization', 'name logo')
    .populate('ticket', 'ticketNumber ticketType status')
    .sort({ checkInAt: -1 });
};

export const getEventAttendanceService = async ({ organizationId, eventId }) => {
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

  return Attendance.find({ organization: organizationId, event: eventId })
    .populate('user', 'name email avatar')
    .populate('ticket', 'ticketNumber ticketType')
    .populate('checkedInBy', 'name email')
    .populate('checkedOutBy', 'name email')
    .sort({ checkInAt: -1 });
};

export const getAttendanceSummaryService = async ({ organizationId, eventId }) => {
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

  const totalRegistered = await Registration.countDocuments({
    event: eventId,
    status: REGISTRATION_STATUS.CONFIRMED
  });

  const checkedIn = await Attendance.countDocuments({
    event: eventId,
    status: ATTENDANCE_STATUS.CHECKED_IN
  });

  const checkedOut = await Attendance.countDocuments({
    event: eventId,
    status: ATTENDANCE_STATUS.CHECKED_OUT
  });

  const totalCheckedIn = checkedIn + checkedOut;
  const notCheckedIn = Math.max(0, totalRegistered - totalCheckedIn);
  const attendancePercentage = totalRegistered > 0 ? Math.round((totalCheckedIn / totalRegistered) * 100) : 0;

  return {
    totalRegistered,
    checkedIn,
    checkedOut,
    totalCheckedIn,
    notCheckedIn,
    attendancePercentage
  };
};
