// Main Overview Dashboard Component for EventSphere AI

import { fetchOrganizationEvents, fetchEventAnalytics, fetchOrganizerInsights } from '../api.js';

export const renderDashboardView = async (container, { orgId, eventId, onNavigate, onOpenCreateEvent }) => {
  if (!orgId) {
    container.innerHTML = `
      <div class="state-container glass-card">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <h3>No Active Organization Selected</h3>
        <p style="color: var(--text-muted); max-width: 420px;">Please log in or select an organization to view your dashboard overview.</p>
        <button id="btn-dash-login" class="btn btn-primary btn-sm">Login or Configure Account</button>
      </div>
    `;
    container.querySelector('#btn-dash-login')?.addEventListener('click', () => onNavigate('settings'));
    return;
  }

  container.innerHTML = `
    <div class="state-container">
      <div class="spinner"></div>
      <h3>Loading Workspace Overview...</h3>
      <p style="color: var(--text-muted)">Connecting to EventSphere AI intelligence services</p>
    </div>
  `;

  try {
    const events = await fetchOrganizationEvents(orgId);
    let analyticsData = null;
    let insightsData = null;

    if (eventId) {
      try {
        analyticsData = await fetchEventAnalytics(orgId, eventId);
      } catch (e) {
        console.warn('Dashboard analytics note:', e.message);
      }
      try {
        insightsData = await fetchOrganizerInsights(orgId, eventId);
      } catch (e) {
        console.warn('Dashboard insights note:', e.message);
      }
    }

    const regs = analyticsData?.registrations || {};
    const cap = analyticsData?.capacity || {};
    const risks = insightsData?.risks || [];
    const pred = insightsData?.prediction || {};

    container.innerHTML = `
      <!-- Welcome Header -->
      <div class="dashboard-header glass-card">
        <div class="welcome-text">
          <h2>Welcome back to <span style="color: var(--primary);">EventSphere AI</span></h2>
          <p>Real-time telemetry and predictive intelligence for your active organization.</p>
        </div>
        <div class="quick-actions-bar">
          <button id="btn-quick-create-event" class="btn btn-primary btn-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Create Event
          </button>
          <button id="btn-quick-events" class="btn btn-secondary btn-sm">Manage Events (${events.length})</button>
        </div>
      </div>

      <!-- Quick KPI Stats Strip -->
      <div class="kpi-grid">
        <div class="glass-card kpi-card">
          <div class="kpi-header">
            <span>Total Events</span>
            <div class="kpi-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></div>
          </div>
          <div class="kpi-value">${events.length}</div>
          <div class="kpi-subtext">${events.filter(e => e.status === 'PUBLISHED').length} Published Events</div>
        </div>

        <div class="glass-card kpi-card">
          <div class="kpi-header">
            <span>Confirmed Registrations</span>
            <div class="kpi-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div>
          </div>
          <div class="kpi-value">${regs.confirmed !== undefined ? regs.confirmed : '-'}</div>
          <div class="kpi-subtext">${regs.total || 0} Total Registrations</div>
        </div>

        <div class="glass-card kpi-card">
          <div class="kpi-header">
            <span>Capacity Utilization</span>
            <div class="kpi-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg></div>
          </div>
          <div class="kpi-value">${cap.utilizationRate !== null && cap.utilizationRate !== undefined ? `${cap.utilizationRate}%` : 'N/A'}</div>
          <div class="kpi-subtext">Active event baseline</div>
        </div>

        <div class="glass-card kpi-card">
          <div class="kpi-header">
            <span>AI Risk Radar</span>
            <div class="kpi-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-amber)" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div>
          </div>
          <div class="kpi-value">${risks.length}</div>
          <div class="kpi-subtext">${pred.demandLevel ? `${pred.demandLevel} Demand Projected` : 'Risk Alerts Detected'}</div>
        </div>
      </div>

      <!-- Quick Action Navigation Hub -->
      <div class="action-tiles-grid">
        <div id="tile-analytics" class="glass-card action-tile">
          <div class="tile-icon icon-teal">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
          </div>
          <div class="tile-content">
            <h4>Organizer Analytics</h4>
            <p>View capacity utilization, registration velocity, and attendance trends.</p>
          </div>
          <div class="tile-arrow">→</div>
        </div>

        <div id="tile-insights" class="glass-card action-tile">
          <div class="tile-icon icon-amber">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          </div>
          <div class="tile-content">
            <h4>AI Insights</h4>
            <p>Check operational risk alerts and demand predictions powered by AI.</p>
          </div>
          <div class="tile-arrow">→</div>
        </div>

        <div id="tile-recommendations" class="glass-card action-tile">
          <div class="tile-icon icon-teal">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          </div>
          <div class="tile-content">
            <h4>For You (Recommendations)</h4>
            <p>Discover personalized upcoming events and conferences.</p>
          </div>
          <div class="tile-arrow">→</div>
        </div>
      </div>

      <!-- Upcoming Events Overview Table / Cards -->
      <div class="glass-card section-card">
        <div class="card-header-flex">
          <div class="card-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            Active Organization Events
          </div>
          <button id="btn-view-all-events" class="btn btn-secondary btn-xs">View All Events</button>
        </div>

        ${events.length > 0 ? `
          <div class="events-table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Status</th>
                  <th>Category</th>
                  <th>Capacity</th>
                  <th>Start Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${events.slice(0, 5).map(e => `
                  <tr>
                    <td class="font-weight-600">${escapeHtml(e.title)}</td>
                    <td><span class="status-pill ${e.status.toLowerCase()}">${escapeHtml(e.status)}</span></td>
                    <td>${escapeHtml(e.category || 'General')}</td>
                    <td>${e.capacity !== undefined ? e.capacity : 'Uncapped'}</td>
                    <td>${new Date(e.startDate).toLocaleDateString()}</td>
                    <td>
                      <button class="btn btn-outline btn-xs btn-inspect-event" data-event-id="${e._id}">
                        View Analytics
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `
          <div class="empty-state-box">
            <p style="color: var(--text-muted)">No events found in this organization yet.</p>
            <button id="btn-create-first-event" class="btn btn-primary btn-sm" style="margin-top: 0.5rem;">Create Your First Event</button>
          </div>
        `}
      </div>
    `;

    container.querySelector('#btn-quick-create-event')?.addEventListener('click', onOpenCreateEvent);
    container.querySelector('#btn-create-first-event')?.addEventListener('click', onOpenCreateEvent);
    container.querySelector('#btn-quick-events')?.addEventListener('click', () => onNavigate('events'));
    container.querySelector('#btn-view-all-events')?.addEventListener('click', () => onNavigate('events'));

    container.querySelector('#tile-analytics')?.addEventListener('click', () => onNavigate('analytics'));
    container.querySelector('#tile-insights')?.addEventListener('click', () => onNavigate('insights'));
    container.querySelector('#tile-recommendations')?.addEventListener('click', () => onNavigate('recommendations'));

    container.querySelectorAll('.btn-inspect-event').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-event-id');
        if (id) {
          localStorage.setItem('eventsphere_event_id', id);
          onNavigate('analytics');
        }
      });
    });

  } catch (err) {
    container.innerHTML = `
      <div class="state-container glass-card">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--status-danger)" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <h3>Failed to Load Dashboard</h3>
        <p style="color: var(--text-muted); max-width: 450px;">${escapeHtml(err.message || 'Error connecting to API')}</p>
        <button id="btn-retry-dash" class="btn btn-primary btn-sm">Retry Request</button>
      </div>
    `;
    container.querySelector('#btn-retry-dash')?.addEventListener('click', () => {
      renderDashboardView(container, { orgId, eventId, onNavigate, onOpenCreateEvent });
    });
  }
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
