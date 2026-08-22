import { getEventAnalyticsService } from './analytics.service.js';
import { predictDemandService } from './demandPrediction.service.js';
import { detectEventRisksService } from './eventRisk.service.js';
import { generateAiExecutiveSummary } from './ai.service.js';

export const getOrganizerInsightsService = async ({ organizationId, eventId }) => {
  // 1. Obtain verified analytics (verifies organizationId and eventId tenant isolation)
  const analytics = await getEventAnalyticsService({ organizationId, eventId });
  const event = analytics.event;

  // 2. Compute Prediction & Risks without redundant database queries
  const prediction = await predictDemandService({ event, analytics });
  const risks = await detectEventRisksService({ event, analytics });

  // 3. Generate Deterministic Insights
  const deterministicInsights = [];

  if (analytics.registrations.confirmed > 0) {
    const capacityText = event.capacity ? ` out of ${event.capacity} capacity` : ' (Uncapped capacity)';
    const utilText = analytics.capacity.utilizationRate !== null ? ` (${analytics.capacity.utilizationRate}% utilization)` : '';
    deterministicInsights.push(`Event currently has ${analytics.registrations.confirmed} confirmed registrations${capacityText}${utilText}.`);
  } else {
    deterministicInsights.push('Event currently has zero confirmed registrations. Promotion is recommended.');
  }

  if (prediction.demandLevel === 'HIGH') {
    deterministicInsights.push('Current demand is HIGH relative to available capacity and registration timing.');
  } else if (prediction.demandLevel === 'MODERATE') {
    deterministicInsights.push('Current demand is MODERATE and tracking as expected.');
  } else {
    deterministicInsights.push('Current demand is LOW. Additional marketing outreach may increase registrations.');
  }

  if (analytics.attendance.total > 0) {
    deterministicInsights.push(`Check-in rate is currently at ${analytics.attendance.attendanceRate}% (${analytics.attendance.total} checked in).`);
  }

  if (Array.isArray(risks) && risks.length > 0) {
    risks.forEach((risk) => {
      deterministicInsights.push(`Risk Alert [${risk.type}]: ${risk.explanation}`);
    });
  }

  // 4. Isolated AI Provider Call (Gemini integration with graceful fallback)
  const aiResult = await generateAiExecutiveSummary({ event, analytics, prediction, risks });

  return {
    event: analytics.event,
    analytics,
    prediction,
    risks,
    deterministicInsights,
    aiSummary: aiResult.aiSummary,
    aiAvailable: aiResult.aiAvailable
  };
};
