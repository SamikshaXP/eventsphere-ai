import {
  checkInService,
  checkOutService,
  getMyAttendanceService,
  getEventAttendanceService,
  getAttendanceSummaryService
} from '../services/attendance.service.js';

export const checkIn = async (req, res, next) => {
  try {
    const { organizationId, eventId } = req.params;
    const { qrToken, token, checkInToken, ticketNumber } = req.body;

    const tokenToUse = qrToken || token || checkInToken || ticketNumber;

    const attendance = await checkInService({
      organizationId,
      eventId,
      qrToken: tokenToUse,
      checkedInByUserId: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Check-in successful',
      data: {
        attendance
      }
    });
  } catch (error) {
    next(error);
  }
};

export const checkOut = async (req, res, next) => {
  try {
    const { organizationId, eventId, attendanceId } = req.params;

    const attendance = await checkOutService({
      organizationId,
      eventId,
      attendanceId,
      checkedOutByUserId: req.user._id
    });

    res.status(200).json({
      success: true,
      message: 'Check-out successful',
      data: {
        attendance
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMyAttendance = async (req, res, next) => {
  try {
    const attendanceRecords = await getMyAttendanceService({
      userId: req.user._id
    });

    res.status(200).json({
      success: true,
      data: {
        attendance: attendanceRecords
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getEventAttendance = async (req, res, next) => {
  try {
    const { organizationId, eventId } = req.params;

    const attendanceRecords = await getEventAttendanceService({
      organizationId,
      eventId
    });

    res.status(200).json({
      success: true,
      data: {
        attendance: attendanceRecords
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAttendanceSummary = async (req, res, next) => {
  try {
    const { organizationId, eventId } = req.params;

    const summary = await getAttendanceSummaryService({
      organizationId,
      eventId
    });

    res.status(200).json({
      success: true,
      data: {
        summary
      }
    });
  } catch (error) {
    next(error);
  }
};
