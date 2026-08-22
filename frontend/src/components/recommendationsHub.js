// User Recommendations Hub Component

import { fetchUserRecommendations } from '../api.js';

export const renderRecommendationsHub = async (container, { onOpenConfig }) => {
  // Loading State
  container.innerHTML = `
    <div class="state-container">
      <div class="spinner"></div>
      <h3>Fetching Your Personalized Recommendations...</h3>
      <p style="color: var(--text-muted)">Scanning preferred categories and community organization events</p>
    </div>
  `;

  try {
    const recommendations = await fetchUserRecommendations();

    if (!Array.isArray(recommendations) || recommendations.length === 0) {
      container.innerHTML = `
        <div class="state-container">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-muted)"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          <h3>No Recommendations Found</h3>
          <p style="color: var(--text-muted); max-width: 450px;">You're either registered for all upcoming events or no new public events match your profile currently.</p>
          <button id="btn-refresh-rec" class="btn btn-primary btn-sm">Refresh List</button>
        </div>
      `;
      container.querySelector('#btn-refresh-rec')?.addEventListener('click', () => {
        renderRecommendationsHub(container, { onOpenConfig });
      });
      return;
    }

    // Extract unique categories for filter bar
    const categories = ['All', ...new Set(recommendations.map(r => r.event?.category).filter(Boolean))];

    container.innerHTML = `
      <div class="recommendations-header">
        <div>
          <h2 style="font-size: 1.4rem; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 0.6rem;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            Recommended Events For You
          </h2>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
            Personalized discovery powered by event history, category preferences, and organization memberships.
          </p>
        </div>
        
        <div class="category-filter-bar" id="category-filter-bar">
          ${categories.map((cat, idx) => `
            <button class="btn btn-outline btn-xs cat-filter-btn ${idx === 0 ? 'active' : ''}" data-category="${escapeHtml(cat)}">
              ${escapeHtml(cat)}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="rec-grid" id="rec-grid-items">
        ${renderRecCards(recommendations)}
      </div>
    `;

    // Category Filter Event Listeners
    container.querySelectorAll('.cat-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        container.querySelectorAll('.cat-filter-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const selectedCategory = e.currentTarget.getAttribute('data-category');
        
        const filtered = selectedCategory === 'All' 
          ? recommendations 
          : recommendations.filter(r => r.event?.category === selectedCategory);
        
        const grid = container.querySelector('#rec-grid-items');
        if (grid) grid.innerHTML = renderRecCards(filtered);
      });
    });

  } catch (err) {
    container.innerHTML = `
      <div class="state-container">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent-rose)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <h3>Authentication or Request Required</h3>
        <p style="color: var(--text-muted); max-width: 450px;">${escapeHtml(err.message || 'Please authenticate to load recommendations.')}</p>
        <div style="display: flex; gap: 0.75rem; margin-top: 0.5rem;">
          <button id="btn-retry-rec" class="btn btn-primary btn-sm">Retry Request</button>
          <button id="btn-login-rec" class="btn btn-secondary btn-sm">Login / Configure Settings</button>
        </div>
      </div>
    `;
    container.querySelector('#btn-retry-rec')?.addEventListener('click', () => {
      renderRecommendationsHub(container, { onOpenConfig });
    });
    container.querySelector('#btn-login-rec')?.addEventListener('click', onOpenConfig);
  }
};

function renderRecCards(items) {
  if (!items || items.length === 0) {
    return `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 3rem;">No events match this category filter.</div>`;
  }

  return items.map(item => {
    const ev = item.event || {};
    const scorePct = Math.round((item.score || 0.5) * 100);
    const startDateFormatted = ev.startDate ? new Date(ev.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD';

    return `
      <div class="glass-card rec-card">
        <div class="rec-card-header">
          <div class="rec-title">${escapeHtml(ev.title || 'Untitled Event')}</div>
          <div class="rec-score-pill">
            ★ ${scorePct}% Match
          </div>
        </div>

        <div class="rec-reason-box">
          ${escapeHtml(item.reason || 'Recommended event for your profile.')}
        </div>

        <div class="rec-meta">
          <div class="rec-meta-row">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
            <span>Category: <strong>${escapeHtml(ev.category || 'General')}</strong></span>
          </div>
          <div class="rec-meta-row">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line></svg>
            <span>Date: ${startDateFormatted}</span>
          </div>
          ${ev.organization ? `
            <div class="rec-meta-row">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
              <span>Hosted by: <strong>${escapeHtml(ev.organization.name || 'Organization')}</strong></span>
            </div>
          ` : ''}
          ${ev.venue ? `
            <div class="rec-meta-row">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              <span>Location: ${escapeHtml(ev.venue)}</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
