import mongoose from 'mongoose';
import Event from '../models/event.model.js';
import Registration, { REGISTRATION_STATUS } from '../models/registration.model.js';
import Ticket from '../models/ticket.model.js';
import Attendance, { ATTENDANCE_STATUS } from '../models/attendance.model.js';
import ApiError from '../utils/ApiError.js';

export const getEventAnalyticsService = async ({ organizationId, eventId }) => {
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

  // 1. Registration Metrics
  const totalRegistrations = await Registration.countDocuments({ event: eventId });
  const confirmedRegistrations = await Registration.countDocuments({
    event: eventId,
    status: REGISTRATION_STATUS.CONFIRMED
  });
  const waitlistedRegistrations = await Registration.countDocuments({
    event: eventId,
    status: REGISTRATION_STATUS.WAITLISTED
  });
  const cancelledRegistrations = await Registration.countDocuments({
    event: eventId,
    status: REGISTRATION_STATUS.CANCELLED
  });

  // 2. Ticket Metrics
  const totalTicketsIssued = await Ticket.countDocuments({ event: eventId });

  // 3. Attendance Metrics
  const checkedIn = await Attendance.countDocuments({
    event: eventId,
    status: ATTENDANCE_STATUS.CHECKED_IN
  });
  const checkedOut = await Attendance.countDocuments({
    event: eventId,
    status: ATTENDANCE_STATUS.CHECKED_OUT
  });
  const totalAttendance = checkedIn + checkedOut;

  // 4. Rate Calculations
  const attendanceRate = confirmedRegistrations > 0
    ? Math.round((totalAttendance / confirmedRegistrations) * 100)
    : 0;

  const capacityUtilization = event.capacity && event.capacity > 0
    ? Math.round((confirmedRegistrations / event.capacity) * 100)
    : 0;

  const cancellationRate = totalRegistrations > 0
    ? Math.round((cancelledRegistrations / totalRegistrations) * 100)
    : 0;

  // 5. Velocity Calculation
  const createdAtTime = new Date(event.createdAt).getTime();
  const daysActive = Math.max(1, Math.ceil((Date.now() - createdAtTime) / (1000 * 60 * 60 * 24)));
  const registrationVelocity = parseFloat((confirmedRegistrations / daysActive).toFixed(2));

  // 6. Daily Trends via Aggregation
  const eventObjId = new mongoose.Types.ObjectId(eventId);

  const registrationsByDay = await Registration.aggregate([
    { $match: { event: eventObjId } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: '$_id', count: 1 } }
  ]);

  const attendanceByDay = await Attendance.aggregate([
    { $match: { event: eventObjId } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$checkInAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: '$_id', count: 1 } }
  ]);

  return {
    event: {
      id: event._id,
      title: event.title,
      capacity: event.capacity,
      status: event.status,
      startDate: event.startDate,
      endDate: event.endDate
    },
    registrations: {
      total: totalRegistrations,
      confirmed: confirmedRegistrations,
      waitlisted: waitlistedRegistrations,
      cancelled: cancelledRegistrations,
      cancellationRate
    },
    tickets: {
      totalIssued: totalTicketsIssued
    },
    attendance: {
      checkedIn,
      checkedOut,
      total: totalAttendance,
      attendanceRate
    },
    capacity: {
      utilizationRate: capacityUtilization
    },
    velocity: {
      registrationVelocity,
      daysActive
    },
    trends: {
      registrationsByDay,
      attendanceByDay
    }
  };
};
