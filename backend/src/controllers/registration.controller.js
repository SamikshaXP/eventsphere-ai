import {
  registerForEventService,
  cancelRegistrationService,
  getMyRegistrationsService,
  getRegistrationByIdService,
  getEventRegistrationsService
} from '../services/registration.service.js';

export const registerForEvent = async (req, res, next) => {
  try {
    const { organizationId, eventId } = req.params;
    const { ticketType } = req.body;

    const result = await registerForEventService({
      organizationId,
      eventId,
      userId: req.user._id,
      ticketType
    });

    res.status(201).json({
      success: true,
      message: result.isWaitlisted
        ? 'Event capacity reached. Added to waitlist.'
        : 'Event registration successful',
      data: {
        registration: result.registration,
        ticket: result.ticket
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMyRegistrations = async (req, res, next) => {
  try {
    const registrations = await getMyRegistrationsService({
      userId: req.user._id
    });

    res.status(200).json({
      success: true,
      data: {
        registrations
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getRegistrationById = async (req, res, next) => {
  try {
    const { registrationId } = req.params;
    const registration = await getRegistrationByIdService({
      registrationId,
      userId: req.user._id
    });

    res.status(200).json({
      success: true,
      data: {
        registration
      }
    });
  } catch (error) {
    next(error);
  }
};

export const cancelRegistration = async (req, res, next) => {
  try {
    const { registrationId } = req.params;
    const registration = await cancelRegistrationService({
      registrationId,
      userId: req.user._id
    });

    res.status(200).json({
      success: true,
      message: 'Registration cancelled successfully',
      data: {
        registration
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getEventRegistrations = async (req, res, next) => {
  try {
    const { organizationId, eventId } = req.params;
    const registrations = await getEventRegistrationsService({
      organizationId,
      eventId
    });

    res.status(200).json({
      success: true,
      data: {
        registrations
      }
    });
  } catch (error) {
    next(error);
  }
};
