import { EVENT_STATUS } from '../models/event.model.js';

export const detectEventRisksService = async ({ event, analytics }) => {
  const risks = [];

  const confirmed = analytics.registrations.confirmed || 0;
  const totalReg = analytics.registrations.total || 0;
  const capacity = (event.capacity && Number.isInteger(event.capacity) && event.capacity > 0)
    ? event.capacity
    : null;

  const utilization = analytics.capacity.utilizationRate;
  const cancellationRate = analytics.registrations.cancellationRate || 0;
  const attendanceRate = analytics.attendance.attendanceRate || 0;

  const now = Date.now();
  const startDate = new Date(event.startDate).getTime();
  const daysRemaining = Math.max(0, Math.ceil((startDate - now) / (1000 * 60 * 60 * 24)));

  // Risk 1: LOW_REGISTRATION
  if (event.status === EVENT_STATUS.PUBLISHED && daysRemaining <= 14 && capacity !== null && utilization !== null && utilization < 40) {
    const severity = (daysRemaining <= 7 && utilization < 20) ? 'HIGH' : 'MEDIUM';
    const score = parseFloat((1 - (utilization / 100)).toFixed(2));
    risks.push({
      type: 'LOW_REGISTRATION',
      severity,
      score,
      explanation: `Registration velocity is low with ${daysRemaining} days remaining and capacity utilization at ${utilization}%.`
    });
  }

  // Risk 2: HIGH_CANCELLATION
  if (totalReg >= 5 && cancellationRate >= 20) {
    const severity = cancellationRate >= 40 ? 'HIGH' : 'MEDIUM';
    const score = parseFloat(Math.min(1.0, cancellationRate / 100).toFixed(2));
    risks.push({
      type: 'HIGH_CANCELLATION',
      severity,
      score,
      explanation: `Cancellation rate of ${cancellationRate}% exceeds normal baseline threshold of 20%.`
    });
  }

  // Risk 3: CAPACITY_PRESSURE
  if ((capacity !== null && utilization !== null && utilization >= 90) || analytics.registrations.waitlisted > 0) {
    const severity = (utilization !== null && utilization >= 100) || analytics.registrations.waitlisted >= 5 ? 'HIGH' : 'MEDIUM';
    const score = capacity !== null ? parseFloat(Math.min(1.0, utilization / 100).toFixed(2)) : 0.90;
    risks.push({
      type: 'CAPACITY_PRESSURE',
      severity,
      score,
      explanation: `Event has high capacity pressure with ${utilization || 'uncapped'}% capacity and ${analytics.registrations.waitlisted} waitlisted registrations.`
    });
  }

  // Risk 4: LOW_ATTENDANCE
  if ((event.status === EVENT_STATUS.ONGOING || event.status === EVENT_STATUS.COMPLETED || daysRemaining === 0) && confirmed >= 5 && attendanceRate < 50) {
    const severity = attendanceRate < 30 ? 'HIGH' : 'MEDIUM';
    const score = parseFloat((1 - (attendanceRate / 100)).toFixed(2));
    risks.push({
      type: 'LOW_ATTENDANCE',
      severity,
      score,
      explanation: `Actual check-in rate of ${attendanceRate}% is significantly below confirmed registrations.`
    });
  }

  return risks;
};
