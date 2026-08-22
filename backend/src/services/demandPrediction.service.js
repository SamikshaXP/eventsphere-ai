import { EVENT_STATUS } from '../models/event.model.js';

export const predictDemandService = async ({ event, analytics }) => {
  const confirmed = analytics.registrations.confirmed || 0;
  const capacity = (event.capacity && Number.isInteger(event.capacity) && event.capacity > 0)
    ? event.capacity
    : null;

  const velocity = analytics.velocity.registrationVelocity || 0;

  const now = Date.now();
  const startDate = new Date(event.startDate).getTime();
  const msRemaining = startDate - now;
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

  const isEventStarted = daysRemaining === 0 || [EVENT_STATUS.ONGOING, EVENT_STATUS.COMPLETED].includes(event.status);

  // 1. Calculate projected registrations deterministically
  // Heuristic deceleration factor (0.80) accounts for registration velocity slowdown near event date
  const DECAY_FACTOR = 0.80;
  let projectedAddition = 0;

  if (!isEventStarted) {
    if (velocity > 0) {
      projectedAddition = Math.round(velocity * Math.min(daysRemaining, 14) * DECAY_FACTOR);
    } else if (confirmed > 0 && daysRemaining > 0) {
      projectedAddition = Math.round(confirmed * 0.10);
    }
  }

  let predictedRegistrations = confirmed + projectedAddition;

  // Enforce boundary constraints: non-negative & capped at capacity if capacity exists
  if (capacity !== null) {
    predictedRegistrations = Math.min(capacity, Math.max(confirmed, predictedRegistrations));
  } else {
    predictedRegistrations = Math.max(confirmed, predictedRegistrations);
  }

  // 2. Predicted Capacity Utilization
  const predictedUtilization = capacity !== null
    ? parseFloat((predictedRegistrations / capacity).toFixed(2))
    : null;

  // 3. Demand Level Classification
  let demandLevel = 'LOW';
  if (capacity !== null) {
    if (predictedUtilization >= 0.80 || confirmed >= capacity) {
      demandLevel = 'HIGH';
    } else if (predictedUtilization >= 0.40) {
      demandLevel = 'MODERATE';
    }
  } else {
    if (confirmed >= 50 || velocity >= 5) {
      demandLevel = 'HIGH';
    } else if (confirmed >= 15 || velocity >= 2) {
      demandLevel = 'MODERATE';
    }
  }

  // 4. Heuristic Confidence Quality Score (0.50 - 0.90)
  const daysActive = analytics.velocity.daysActive || 1;
  const isHistoricalDataSufficient = daysActive >= 2 && confirmed >= 3;

  let confidence = 0.50;
  if (confirmed >= 20) {
    confidence = 0.90;
  } else if (confirmed >= 10) {
    confidence = 0.80;
  } else if (confirmed >= 3) {
    confidence = 0.70;
  } else {
    confidence = 0.55;
  }

  let explanation = `Predicted ${predictedRegistrations} registrations based on velocity of ${velocity} reg/day with ${daysRemaining} days remaining.`;
  if (capacity !== null) {
    explanation += ` Capacity utilization predicted at ${Math.round((predictedUtilization || 0) * 100)}%.`;
  } else {
    explanation += ' Event capacity is uncapped.';
  }

  if (!isHistoricalDataSufficient) {
    explanation += ' Limited historical registration data available.';
  }

  return {
    predictedRegistrations,
    capacity,
    predictedUtilization,
    demandLevel,
    confidence: parseFloat(confidence.toFixed(2)),
    confidenceType: 'HEURISTIC',
    isHistoricalDataSufficient,
    explanation
  };
};
