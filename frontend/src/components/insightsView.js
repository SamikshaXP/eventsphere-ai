// Dedicated AI Insights & Intelligence Component for EventSphere AI

import { fetchOrganizerInsights } from '../api.js';

export const renderInsightsView = async (container, { orgId, eventId, onNavigate, onOpenConfig }) => {
  if (!orgId || !eventId) {
    container.innerHTML = `
      <div class="state-container glass-card">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
        <h3>No Event Selected for Insights</h3>
        <p style="color: var(--text-muted); max-width: 420px;">Please select an Event from the Dashboard or Events screen to analyze AI predictions and risk intelligence.</p>
        <button id="btn-select-evt-insights" class="btn btn-primary btn-sm">Select Event from Dashboard</button>
      </div>
    `;
    container.querySelector('#btn-select-evt-insights')?.addEventListener('click', () => onNavigate('dashboard'));
    return;
  }

  container.innerHTML = `
    <div class="state-container">
      <div class="spinner"></div>
      <h3>Generating AI Insights & Predictive Risk Radar...</h3>
      <p style="color: var(--text-muted)">Querying Gemini AI models and deterministic risk engines</p>
    </div>
  `;

  try {
    const insights = await fetchOrganizerInsights(orgId, eventId);

    const event = insights.event || {};
    const pred = insights.prediction || {};
    const risks = insights.risks || [];
    const deterministic = insights.deterministicInsights || [];

    container.innerHTML = `
      <!-- Context Header -->
      <div class="context-bar glass-card">
        <div class="event-title-badge">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          <span class="event-name">${escapeHtml(event.title || 'AI Intelligence')}</span>
          <span class="status-pill published">${escapeHtml(event.status || 'ACTIVE')}</span>
        </div>
        <button id="btn-refresh-insights" class="btn btn-secondary btn-xs">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
          Refresh AI Model
        </button>
      </div>

      <!-- Demand Prediction Banner -->
      <div class="prediction-box glass-card">
        <div>
          <div style="font-size: 0.78rem; font-weight: 700; color: var(--accent-amber); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">
            Demand Prediction Engine
          </div>
          <div style="font-size: 1.2rem; font-weight: 700; color: #fff;">
            Projected Registrations: <strong style="color: var(--primary);">${pred.predictedRegistrations || 0}</strong>
            ${pred.capacity ? `<span style="font-size: 0.9rem; color: var(--text-muted)"> (${Math.round((pred.predictedUtilization || 0) * 100)}% Utilization)</span>` : ''}
          </div>
          <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.4rem; max-width: 680px;">
            ${escapeHtml(pred.explanation || 'Calculated using historical velocity heuristics.')}
          </div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.4rem;">
          <span class="demand-level-pill ${pred.demandLevel}">${pred.demandLevel || 'NORMAL'} DEMAND</span>
          <span style="font-size: 0.75rem; color: var(--text-subtle);">
            Confidence Score: ${Math.round((pred.confidence || 0.5) * 100)}% (${pred.confidenceType || 'HEURISTIC'})
          </span>
        </div>
      </div>

      <!-- AI Executive Summary Card -->
      <div class="glass-card ai-card">
        <div class="card-header-flex">
          <div class="card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-amber)" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            Gemini AI Executive Summary
          </div>
          ${insights.aiAvailable ? `
            <span class="ai-badge-active">
              <span class="pulse-dot"></span> GEMINI AI ACTIVE
            </span>
          ` : `
            <span class="ai-badge-inactive">
              DETERMINISTIC RULE ENGINE
            </span>
          `}
        </div>

        <div class="ai-summary-text">
          ${insights.aiAvailable && insights.aiSummary ? `
            <p style="font-style: italic; border-left: 3px solid var(--accent-amber); padding-left: 0.85rem; color: #f1f5f9; font-size: 0.95rem;">
              "${escapeHtml(insights.aiSummary)}"
            </p>
          ` : `
            <p style="color: var(--text-muted); font-size: 0.9rem;">
              AI narrative model offline or key unconfigured. Displaying rule-validated executive intelligence.
            </p>
          `}
        </div>
      </div>

      <!-- Operational Risk Radar Section -->
      <div class="glass-card section-card">
        <div class="card-header-flex">
          <div class="card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-amber)" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            Operational Risk Alerts
          </div>
          <span style="font-size: 0.8rem; color: var(--text-muted)">${risks.length} Alert(s) Detected</span>
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
                <div style="font-size: 0.72rem; color: var(--text-subtle); margin-top: 0.4rem;">Risk Score: ${r.score} / 100</div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="empty-state-box" style="background: rgba(52, 211, 153, 0.05); border: 1px dashed rgba(52, 211, 153, 0.2); color: var(--status-success);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            No operational risks detected. Metrics are within optimal baseline thresholds.
          </div>
        `}
      </div>

      <!-- Actionable Insights List -->
      <div class="glass-card section-card">
        <div class="card-title" style="margin-bottom: 1rem;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line></svg>
          Verified Actionable Recommendations
        </div>
        <div class="deterministic-list">
          ${deterministic.map(item => `
            <div class="insight-item">
              <span class="insight-bullet">▸</span>
              <span>${escapeHtml(item)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    container.querySelector('#btn-refresh-insights')?.addEventListener('click', () => {
      renderInsightsView(container, { orgId, eventId, onNavigate, onOpenConfig });
    });

  } catch (err) {
    container.innerHTML = `
      <div class="state-container glass-card">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--status-danger)" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <h3>Failed to Load Insights</h3>
        <p style="color: var(--text-muted)">${escapeHtml(err.message || 'Error generating insights')}</p>
      </div>
    `;
  }
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
