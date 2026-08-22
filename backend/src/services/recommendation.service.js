import mongoose from 'mongoose';
import Event, { EVENT_STATUS, EVENT_VISIBILITY } from '../models/event.model.js';
import Registration from '../models/registration.model.js';
import Membership, { MEMBERSHIP_STATUS } from '../models/membership.model.js';

export const getMyRecommendationsService = async ({ userId }) => {
  // 1. Get user's past registrations
  const userRegistrations = await Registration.find({ user: userId }).populate('event');
  const registeredEventIds = new Set(userRegistrations.map((r) => r.event?._id?.toString()).filter(Boolean));

  // Build preference categories & tags
  const categoryCounts = {};
  userRegistrations.forEach((r) => {
    if (r.event && r.event.category) {
      categoryCounts[r.event.category] = (categoryCounts[r.event.category] || 0) + 1;
    }
  });

  const preferredCategories = Object.keys(categoryCounts).sort((a, b) => categoryCounts[b] - categoryCounts[a]);

  // 2. Get user's active organization memberships
  const memberships = await Membership.find({ user: userId, status: MEMBERSHIP_STATUS.ACTIVE });
  const userOrgIds = memberships.map((m) => m.organization.toString());

  // 3. Find candidate upcoming events user is NOT registered for
  const now = new Date();
  const candidateEvents = await Event.find({
    _id: { $nin: Array.from(registeredEventIds) },
    status: { $in: [EVENT_STATUS.PUBLISHED, EVENT_STATUS.ONGOING] },
    startDate: { $gte: now }
  }).populate('organization', 'name logo');

  // 4. Filter visibility & score candidates
  const recommendations = [];

  for (const ev of candidateEvents) {
    const isPublic = ev.visibility === EVENT_VISIBILITY.PUBLIC;
    const isOrgMember = userOrgIds.includes(ev.organization?._id?.toString());

    // Authorization filter: user can see PUBLIC events OR PRIVATE events in their orgs
    if (!isPublic && !isOrgMember) {
      continue;
    }

    let score = 0.50;
    let reason = 'Discover popular upcoming events on EventSphere.';

    if (preferredCategories.length > 0 && preferredCategories.includes(ev.category)) {
      score += 0.35;
      reason = `Recommended because you previously registered for ${ev.category} events.`;
    } else if (isOrgMember) {
      score += 0.25;
      reason = `Recommended because you are a member of ${ev.organization?.name || 'this organization'}.`;
    } else if (ev.capacity > 0) {
      score += 0.15;
      reason = 'Trending upcoming event in your community.';
    }

    score = Math.min(0.99, parseFloat(score.toFixed(2)));

    recommendations.push({
      event: {
        _id: ev._id,
        title: ev.title,
        category: ev.category,
        startDate: ev.startDate,
        endDate: ev.endDate,
        locationType: ev.locationType,
        venue: ev.venue,
        organization: ev.organization,
        bannerImage: ev.bannerImage
      },
      score,
      reason
    });
  }

  // Sort by score descending
  recommendations.sort((a, b) => b.score - a.score);

  return recommendations;
};
