import { getEventAnalyticsService } from '../services/analytics.service.js';
import { getOrganizerInsightsService } from '../services/insight.service.js';
import { getMyRecommendationsService } from '../services/recommendation.service.js';

export const getEventAnalytics = async (req, res, next) => {
  try {
    const { organizationId, eventId } = req.params;

    const analytics = await getEventAnalyticsService({
      organizationId,
      eventId
    });

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
};

export const getEventInsights = async (req, res, next) => {
  try {
    const { organizationId, eventId } = req.params;

    const result = await getOrganizerInsightsService({
      organizationId,
      eventId
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getMyRecommendations = async (req, res, next) => {
  try {
    const recommendations = await getMyRecommendationsService({
      userId: req.user._id
    });

    res.status(200).json({
      success: true,
      data: {
        recommendations
      }
    });
  } catch (error) {
    next(error);
  }
};
