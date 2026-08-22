// Organizer Analytics & Insights Dashboard Component

import { fetchEventAnalytics, fetchOrganizerInsights } from '../api.js';

export const renderAnalyticsDashboard = async (container, { orgId, eventId, onOpenConfig }) => {
  if (!orgId || !eventId) {
    container.innerHTML = `
      <div class="state-container">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-muted)"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <h3>No Event Selected</h3>
        <p style="color: var(--text-muted); max-width: 420px;">Please configure an Organization ID and Event ID in Settings or log in to view real event analytics.</p>
        <button id="btn-select-event" class="btn btn-primary btn-sm">Configure Settings & Login</button>
      </div>
    `;
    container.querySelector('#btn-select-event')?.addEventListener('click', onOpenConfig);
    return;
  }

  // Loading State
  container.innerHTML = `
    <div class="state-container">
      <div class="spinner"></div>
      <h3>Fetching Event Analytics...</h3>
      <p style="color: var(--text-muted)">Connecting to EventSphere AI backend APIs</p>
    </div>
  `;

  try {
    const [analytics, insights] = await Promise.all([
      fetchEventAnalytics(orgId, eventId),
      fetchOrganizerInsights(orgId, eventId)
    ]);

    const event = analytics.event || {};
    const regs = analytics.registrations || {};
    const att = analytics.attendance || {};
    const cap = analytics.capacity || {};
    const vel = analytics.velocity || {};
    const pred = insights.prediction || {};
    const risks = insights.risks || [];
    const deterministicInsights = insights.deterministicInsights || [];

    const isPublished = event.status === 'PUBLISHED';
    const isOngoing = event.status === 'ONGOING';
    const statusClass = isPublished ? 'published' : isOngoing ? 'ongoing' : '';

    container.innerHTML = `
      <!-- Context Toolbar -->
      <div class="context-bar">
        <div class="event-title-badge">
          <span class="event-name">${escapeHtml(event.title || 'Event Analytics')}</span>
          <span class="status-pill ${statusClass}">${escapeHtml(event.status || 'ACTIVE')}</span>
        </div>
        <div style="display: flex; gap: 0.75rem; align-items: center;">
          <span style="font-size: 0.8rem; color: var(--text-muted)">
            Capacity: <strong>${event.capacity !== null && event.capacity !== undefined ? event.capacity : 'Uncapped'}</strong>
          </span>
          <button id="btn-refresh-analytics" class="btn btn-secondary btn-xs" title="Refresh metrics">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
            Refresh
          </button>
        </div>
      </div>

      <!-- Main KPI Grid -->
      <div class="kpi-grid">
        <div class="glass-card kpi-card">
          <div class="kpi-header">
            <span>Total Registrations</span>
            <div class="kpi-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div>
          </div>
          <div class="kpi-value">${regs.total || 0}</div>
          <div class="kpi-subtext">${regs.confirmed || 0} Confirmed (${regs.cancellationRate || 0}% Cancellation)</div>
        </div>

        <div class="glass-card kpi-card">
          <div class="kpi-header">
            <span>Capacity Utilization</span>
            <div class="kpi-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg></div>
          </div>
          <div class="kpi-value">${cap.utilizationRate !== null ? `${cap.utilizationRate}%` : 'N/A'}</div>
          <div class="capacity-container">
            <div class="progress-bar-bg">
              <div class="progress-bar-fill ${cap.utilizationRate >= 90 ? 'high-danger' : ''}" style="width: ${Math.min(100, cap.utilizationRate || 0)}%"></div>
            </div>
          </div>
        </div>

        <div class="glass-card kpi-card">
          <div class="kpi-header">
            <span>Attendance Rate</span>
            <div class="kpi-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></div>
          </div>
          <div class="kpi-value">${att.attendanceRate || 0}%</div>
          <div class="kpi-subtext">${att.total || 0} Checked-In / ${regs.confirmed || 0} Confirmed</div>
        </div>

        <div class="glass-card kpi-card">
          <div class="kpi-header">
            <span>Velocity (Reg / Day)</span>
            <div class="kpi-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg></div>
          </div>
          <div class="kpi-value">${vel.registrationVelocity || 0}</div>
          <div class="kpi-subtext">${vel.daysActive || 1} Days Active</div>
        </div>
      </div>

      <!-- Demand Prediction Banner -->
      <div class="prediction-box">
        <div>
          <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">
            Demand Prediction Engine
          </div>
          <div style="font-size: 1.1rem; font-weight: 700; color: #fff;">
            Projected Registrations: <strong style="color: var(--primary);">${pred.predictedRegistrations || 0}</strong>
            ${pred.capacity ? `<span style="font-size: 0.9rem; color: var(--text-muted)"> (${Math.round((pred.predictedUtilization || 0) * 100)}% Capacity)</span>` : ''}
          </div>
          <div style="font-size: 0.83rem; color: var(--text-muted); margin-top: 0.4rem; max-width: 650px;">
            ${escapeHtml(pred.explanation || 'Prediction calculated deterministically.')}
          </div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.4rem;">
          <span class="demand-level-pill ${pred.demandLevel}">${pred.demandLevel || 'UNKNOWN'} DEMAND</span>
          <span style="font-size: 0.75rem; color: var(--text-subtle);">
            Confidence: ${Math.round((pred.confidence || 0.5) * 100)}% (${pred.confidenceType || 'HEURISTIC'})
          </span>
        </div>
      </div>

      <!-- Operational Risk Alerts -->
      <div class="glass-card risks-section">
        <div class="card-header-flex">
          <div class="card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-amber)" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            Operational Risk Radar
          </div>
          <span style="font-size: 0.8rem; color: var(--text-muted)">${risks.length} Risk Alert(s) Detected</span>
        </div>
        
        ${risks.length > 0 ? `
          <div class="risk-cards-grid">
            ${risks.map(r => `
              <div class="risk-card severity-${r.severity}">
                <div class="risk-card-header">
                  <span class="risk-type-tag">${escapeHtml(r.type)}</span>
                  <span class="severity-badge ${r.severity}">${r.severity}</span>
                </div>
                <div class="risk-explanation">${escapeHtml(r.explanation)}</div>
                <div style="font-size: 0.72rem; color: var(--text-subtle); margin-top: 0.2rem;">Risk Index Score: ${r.score}</div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div style="padding: 1.25rem; background: rgba(16, 185, 129, 0.05); border: 1px dashed rgba(16, 185, 129, 0.2); border-radius: var(--radius-sm); color: var(--accent-emerald); font-size: 0.88rem; display: flex; align-items: center; gap: 0.6rem;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            No operational risks detected. Registration and attendance metrics are within optimal baselines.
          </div>
        `}
      </div>

      <!-- Insights Grid (AI Executive Summary + Deterministic Insights) -->
      <div class="insights-grid">
        <!-- AI Executive Summary Card -->
        <div class="glass-card ai-card">
          <div class="card-header-flex">
            <div class="card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              AI Executive Summary
            </div>
            ${insights.aiAvailable ? `
              <span class="ai-badge-active">
                <span class="pulse-dot"></span> GEMINI AI ACTIVE
              </span>
            ` : `
              <span class="ai-badge-inactive">
                DETERMINISTIC FALLBACK
              </span>
            `}
          </div>

          <div class="ai-summary-text">
            ${insights.aiAvailable && insights.aiSummary ? `
              <p style="font-style: italic; border-left: 3px solid var(--primary); padding-left: 0.85rem; color: #f1f5f9;">
                "${escapeHtml(insights.aiSummary)}"
              </p>
            ` : `
              <p style="color: var(--text-muted); font-size: 0.88rem;">
                AI narrative model offline or API key unconfigured. Displaying validated rule-based executive insights.
              </p>
            `}
          </div>
        </div>

        <!-- Deterministic Insights Card -->
        <div class="glass-card">
          <div class="card-header-flex">
            <div class="card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
              Verified Organizer Insights
            </div>
          </div>
          <div class="deterministic-list">
            ${deterministicInsights.map(item => `
              <div class="insight-item">
                <span class="insight-bullet">▸</span>
                <span>${escapeHtml(item)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Trend Charts Grid -->
      <div class="charts-grid">
        <div class="glass-card">
          <div class="card-title" style="margin-bottom: 1rem;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline></svg>
            Daily Registration Velocity Trend
          </div>
          <div class="chart-wrapper">
            ${renderSvgLineChart(analytics.trends?.registrationsByDay || [])}
          </div>
        </div>

        <div class="glass-card">
          <div class="card-title" style="margin-bottom: 1rem;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line></svg>
            Daily Attendance Check-In Trend
          </div>
          <div class="chart-wrapper">
            ${renderSvgBarChart(analytics.trends?.attendanceByDay || [])}
          </div>
        </div>
      </div>
    `;

    container.querySelector('#btn-refresh-analytics')?.addEventListener('click', () => {
      renderAnalyticsDashboard(container, { orgId, eventId, onOpenConfig });
    });

  } catch (err) {
    container.innerHTML = `
      <div class="state-container">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent-rose)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <h3>Failed to Load Analytics</h3>
        <p style="color: var(--text-muted); max-width: 450px;">${escapeHtml(err.message || 'API request failed.')}</p>
        <div style="display: flex; gap: 0.75rem; margin-top: 0.5rem;">
          <button id="btn-retry-analytics" class="btn btn-primary btn-sm">Retry Request</button>
          <button id="btn-err-config" class="btn btn-secondary btn-sm">Configure Settings</button>
        </div>
      </div>
    `;
    container.querySelector('#btn-retry-analytics')?.addEventListener('click', () => {
      renderAnalyticsDashboard(container, { orgId, eventId, onOpenConfig });
    });
    container.querySelector('#btn-err-config')?.addEventListener('click', onOpenConfig);
  }
};

// SVG Line Chart Renderer
function renderSvgLineChart(dataPoints) {
  if (!dataPoints || dataPoints.length === 0) {
    return `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-subtle); font-size: 0.85rem;">No daily registration trend data recorded yet.</div>`;
  }

  const width = 500;
  const height = 180;
  const pad = 30;

  const maxVal = Math.max(...dataPoints.map(d => d.count || 0), 5);
  const minVal = 0;

  const points = dataPoints.map((d, i) => {
    const x = pad + (i / Math.max(1, dataPoints.length - 1)) * (width - 2 * pad);
    const y = height - pad - ((d.count || 0) / maxVal) * (height - 2 * pad);
    return { x, y, date: d.date, count: d.count };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return `
    <svg viewBox="0 0 ${width} ${height}" class="svg-chart">
      <line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" class="chart-axis" />
      <path d="${pathD}" class="chart-path-line" />
      ${points.map(p => `
        <circle cx="${p.x}" cy="${p.y}" class="chart-point">
          <title>${p.date}: ${p.count} registrations</title>
        </circle>
        <text x="${p.x}" y="${height - 8}" text-anchor="middle" class="chart-text">${p.date ? p.date.substring(5) : ''}</text>
      `).join('')}
    </svg>
  `;
}

// SVG Bar Chart Renderer
function renderSvgBarChart(dataPoints) {
  if (!dataPoints || dataPoints.length === 0) {
    return `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-subtle); font-size: 0.85rem;">No daily check-in attendance data recorded yet.</div>`;
  }

  const width = 500;
  const height = 180;
  const pad = 30;

  const maxVal = Math.max(...dataPoints.map(d => d.count || 0), 5);
  const barWidth = Math.min(40, (width - 2 * pad) / dataPoints.length - 10);

  return `
    <svg viewBox="0 0 ${width} ${height}" class="svg-chart">
      <line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" class="chart-axis" />
      ${dataPoints.map((d, i) => {
        const x = pad + i * ((width - 2 * pad) / dataPoints.length) + 5;
        const barHeight = ((d.count || 0) / maxVal) * (height - 2 * pad);
        const y = height - pad - barHeight;
        return `
          <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="url(#barGradient)" rx="4">
            <title>${d.date}: ${d.count} check-ins</title>
          </rect>
          <text x="${x + barWidth / 2}" y="${height - 8}" text-anchor="middle" class="chart-text">${d.date ? d.date.substring(5) : ''}</text>
        `;
      }).join('')}
      <defs>
        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--accent-cyan)" />
          <stop offset="100%" stop-color="var(--primary)" />
        </linearGradient>
      </defs>
    </svg>
  `;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
