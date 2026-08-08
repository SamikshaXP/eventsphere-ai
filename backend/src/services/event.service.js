import mongoose from 'mongoose';
import Event, { EVENT_STATUS, ALLOWED_TRANSITIONS } from '../models/event.model.js';
import Organization from '../models/organization.model.js';
import ApiError from '../utils/ApiError.js';

const generateSlug = (title) => {
  const cleanTitle = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${cleanTitle}-${Date.now().toString(36)}`;
};

export const createEventService = async ({ eventData, organizationId, userId }) => {
  if (!mongoose.Types.ObjectId.isValid(organizationId)) {
    throw new ApiError(400, 'Invalid organization ID format');
  }

  const organization = await Organization.findById(organizationId);
  if (!organization) {
    throw new ApiError(404, 'Organization not found');
  }

  const slug = generateSlug(eventData.title);

  const event = await Event.create({
    ...eventData,
    slug,
    organization: organizationId,
    createdBy: userId
  });

  return event.populate([
    { path: 'createdBy', select: 'name email avatar' },
    { path: 'organization', select: 'name logo' }
  ]);
};

export const getOrganizationEventsService = async ({ organizationId, query = {} }) => {
  if (!mongoose.Types.ObjectId.isValid(organizationId)) {
    throw new ApiError(400, 'Invalid organization ID format');
  }

  const organization = await Organization.findById(organizationId);
  if (!organization) {
    throw new ApiError(404, 'Organization not found');
  }

  const filter = { organization: organizationId };

  if (query.status) {
    filter.status = query.status;
  }
  if (query.category) {
    filter.category = query.category;
  }
  if (query.visibility) {
    filter.visibility = query.visibility;
  }

  const events = await Event.find(filter)
    .populate('createdBy', 'name email avatar')
    .sort({ startDate: 1, createdAt: -1 });

  return events;
};

export const getEventByIdService = async ({ eventId, organizationId }) => {
  if (!mongoose.Types.ObjectId.isValid(organizationId)) {
    throw new ApiError(400, 'Invalid organization ID format');
  }

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw new ApiError(400, 'Invalid event ID format');
  }

  const event = await Event.findOne({
    _id: eventId,
    organization: organizationId
  }).populate([
    { path: 'createdBy', select: 'name email avatar' },
    { path: 'organization', select: 'name logo owner' }
  ]);

  if (!event) {
    throw new ApiError(404, 'Event not found in this organization');
  }

  return event;
};

export const updateEventService = async ({ eventId, organizationId, updateData }) => {
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

  // Prevent modifying organization or createdBy
  delete updateData.organization;
  delete updateData.createdBy;
  delete updateData.status; // Status must be updated through publishEvent/cancelEvent or dedicated lifecycle actions

  if (updateData.title && updateData.title !== event.title) {
    updateData.slug = generateSlug(updateData.title);
  }

  Object.assign(event, updateData);

  await event.save();

  return event.populate([
    { path: 'createdBy', select: 'name email avatar' },
    { path: 'organization', select: 'name logo' }
  ]);
};

export const publishEventService = async ({ eventId, organizationId }) => {
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

  const allowedNextStatuses = ALLOWED_TRANSITIONS[event.status] || [];
  if (!allowedNextStatuses.includes(EVENT_STATUS.PUBLISHED)) {
    throw new ApiError(
      400,
      `Cannot publish event with current status '${event.status}'. Allowed transitions from '${event.status}' are: [${allowedNextStatuses.join(', ')}]`
    );
  }

  event.status = EVENT_STATUS.PUBLISHED;
  await event.save();

  return event.populate([
    { path: 'createdBy', select: 'name email avatar' },
    { path: 'organization', select: 'name logo' }
  ]);
};

export const cancelEventService = async ({ eventId, organizationId }) => {
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

  const allowedNextStatuses = ALLOWED_TRANSITIONS[event.status] || [];
  if (!allowedNextStatuses.includes(EVENT_STATUS.CANCELLED)) {
    throw new ApiError(
      400,
      `Cannot cancel event with current status '${event.status}'. Allowed transitions from '${event.status}' are: [${allowedNextStatuses.join(', ')}]`
    );
  }

  event.status = EVENT_STATUS.CANCELLED;
  await event.save();

  return event.populate([
    { path: 'createdBy', select: 'name email avatar' },
    { path: 'organization', select: 'name logo' }
  ]);
};

export const deleteEventService = async ({ eventId, organizationId }) => {
  if (!mongoose.Types.ObjectId.isValid(organizationId)) {
    throw new ApiError(400, 'Invalid organization ID format');
  }

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw new ApiError(400, 'Invalid event ID format');
  }

  const event = await Event.findOneAndDelete({ _id: eventId, organization: organizationId });
  if (!event) {
    throw new ApiError(404, 'Event not found in this organization');
  }

  return true;
};
