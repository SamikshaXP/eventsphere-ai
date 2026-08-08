import {
  createEventService,
  getOrganizationEventsService,
  getEventByIdService,
  updateEventService,
  publishEventService,
  cancelEventService,
  deleteEventService
} from '../services/event.service.js';

export const createEvent = async (req, res, next) => {
  try {
    const { organizationId } = req.params;
    const event = await createEventService({
      eventData: req.body,
      organizationId,
      userId: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: {
        event
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getOrganizationEvents = async (req, res, next) => {
  try {
    const { organizationId } = req.params;
    const events = await getOrganizationEventsService({
      organizationId,
      query: req.query
    });

    res.status(200).json({
      success: true,
      data: {
        events
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getEventById = async (req, res, next) => {
  try {
    const { organizationId, eventId } = req.params;
    const event = await getEventByIdService({
      eventId,
      organizationId
    });

    res.status(200).json({
      success: true,
      data: {
        event
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    const { organizationId, eventId } = req.params;
    const event = await updateEventService({
      eventId,
      organizationId,
      updateData: req.body
    });

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: {
        event
      }
    });
  } catch (error) {
    next(error);
  }
};

export const publishEvent = async (req, res, next) => {
  try {
    const { organizationId, eventId } = req.params;
    const event = await publishEventService({
      eventId,
      organizationId
    });

    res.status(200).json({
      success: true,
      message: 'Event published successfully',
      data: {
        event
      }
    });
  } catch (error) {
    next(error);
  }
};

export const cancelEvent = async (req, res, next) => {
  try {
    const { organizationId, eventId } = req.params;
    const event = await cancelEventService({
      eventId,
      organizationId
    });

    res.status(200).json({
      success: true,
      message: 'Event cancelled successfully',
      data: {
        event
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req, res, next) => {
  try {
    const { organizationId, eventId } = req.params;
    await deleteEventService({
      eventId,
      organizationId
    });

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
