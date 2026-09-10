// Event Management Screen Component for EventSphere AI

import { fetchOrganizationEvents, publishEvent, cancelEvent } from '../api.js';

export const renderEventsView = async (container, { orgId, onNavigate, onOpenCreateEvent }) => {
  if (!orgId) {
    container.innerHTML = `
      <div class="state-container glass-card">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line></svg>
        <h3>No Organization Selected</h3>
        <p style="color: var(--text-muted)">Select or configure an active organization to manage events.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="state-container">
      <div class="spinner"></div>
      <h3>Fetching Organization Events...</h3>
    </div>
  `;

  try {
    const events = await fetchOrganizationEvents(orgId);
    let activeFilter = 'ALL';
    let searchQuery = '';

    const renderList = () => {
      const filtered = events.filter(e => {
        const matchesFilter = activeFilter === 'ALL' || e.status === activeFilter;
        const matchesSearch = !searchQuery || e.title.toLowerCase().includes(searchQuery.toLowerCase()) || (e.category && e.category.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesFilter && matchesSearch;
      });

      const listContainer = container.querySelector('#events-list-container');
      if (!listContainer) return;

      if (filtered.length === 0) {
        listContainer.innerHTML = `
          <div class="empty-state-box">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line></svg>
            <p style="color: var(--text-muted)">No events match the selected criteria.</p>
          </div>
        `;
        return;
      }

      listContainer.innerHTML = `
        <div class="events-cards-grid">
          ${filtered.map(e => `
            <div class="glass-card event-item-card">
              <div class="event-card-header">
                <span class="status-pill ${e.status.toLowerCase()}">${escapeHtml(e.status)}</span>
                <span class="event-cat-tag">${escapeHtml(e.category || 'General')}</span>
              </div>
              <h3 class="event-card-title">${escapeHtml(e.title)}</h3>
              <p class="event-card-desc">${escapeHtml(e.description || 'No description provided.')}</p>
              
              <div class="event-card-details">
                <div class="detail-row">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  <span>${new Date(e.startDate).toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  <span>${escapeHtml(e.locationType || 'ONLINE')}</span>
                </div>
                <div class="detail-row">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                  <span>Capacity: <strong>${e.capacity !== undefined ? e.capacity : 'Uncapped'}</strong></span>
                </div>
              </div>

              <div class="event-card-footer">
                <button class="btn btn-primary btn-xs btn-analytics-event" data-event-id="${e._id}">
                  Analytics & Insights
                </button>
                <div class="btn-group">
                  ${e.status === 'DRAFT' ? `
                    <button class="btn btn-outline btn-xs btn-publish-event" data-event-id="${e._id}">Publish</button>
                  ` : ''}
                  ${e.status === 'PUBLISHED' || e.status === 'DRAFT' ? `
                    <button class="btn btn-danger btn-xs btn-cancel-event" data-event-id="${e._id}">Cancel</button>
                  ` : ''}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      // Attach event button handlers
      listContainer.querySelectorAll('.btn-analytics-event').forEach(btn => {
        btn.addEventListener('click', (ev) => {
          const id = ev.currentTarget.getAttribute('data-event-id');
          if (id) {
            localStorage.setItem('eventsphere_event_id', id);
            onNavigate('analytics');
          }
        });
      });

      listContainer.querySelectorAll('.btn-publish-event').forEach(btn => {
        btn.addEventListener('click', async (ev) => {
          const id = ev.currentTarget.getAttribute('data-event-id');
          try {
            await publishEvent(orgId, id);
            alert('Event published successfully!');
            renderEventsView(container, { orgId, onNavigate, onOpenCreateEvent });
          } catch (err) {
            alert(`Failed to publish: ${err.message}`);
          }
        });
      });

      listContainer.querySelectorAll('.btn-cancel-event').forEach(btn => {
        btn.addEventListener('click', async (ev) => {
          const id = ev.currentTarget.getAttribute('data-event-id');
          if (confirm('Are you sure you want to cancel this event?')) {
            try {
              await cancelEvent(orgId, id);
              alert('Event cancelled.');
              renderEventsView(container, { orgId, onNavigate, onOpenCreateEvent });
            } catch (err) {
              alert(`Failed to cancel: ${err.message}`);
            }
          }
        });
      });
    };

    container.innerHTML = `
      <!-- Toolbar Header -->
      <div class="context-bar glass-card">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <h2 style="font-size: 1.25rem; font-weight: 700; color: #fff;">Event Management</h2>
          <span style="font-size: 0.8rem; color: var(--text-muted)">(${events.length} Total Events)</span>
        </div>
        <button id="btn-events-create" class="btn btn-primary btn-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Create New Event
        </button>
      </div>

      <!-- Filter and Search Bar -->
      <div class="filter-controls-bar">
        <div class="search-input-wrapper">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" id="input-event-search" class="form-control" placeholder="Search events by title or category..." />
        </div>
        <div class="filter-pills-group">
          <button class="filter-pill active" data-filter="ALL">All</button>
          <button class="filter-pill" data-filter="PUBLISHED">Published</button>
          <button class="filter-pill" data-filter="DRAFT">Draft</button>
          <button class="filter-pill" data-filter="ONGOING">Ongoing</button>
          <button class="filter-pill" data-filter="CANCELLED">Cancelled</button>
        </div>
      </div>

      <!-- Events List Area -->
      <div id="events-list-container"></div>
    `;

    container.querySelector('#btn-events-create')?.addEventListener('click', onOpenCreateEvent);

    const searchInput = container.querySelector('#input-event-search');
    searchInput?.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderList();
    });

    container.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        container.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        e.currentTarget.classList.add('active');
        activeFilter = e.currentTarget.getAttribute('data-filter');
        renderList();
      });
    });

    renderList();

  } catch (err) {
    container.innerHTML = `
      <div class="state-container glass-card">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--status-danger)" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <h3>Failed to Load Events</h3>
        <p style="color: var(--text-muted)">${escapeHtml(err.message || 'Request failed.')}</p>
      </div>
    `;
  }
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
