// Application Settings View Component for EventSphere AI

import { getBaseUrl, setBaseUrl, getAuthToken, setAuthToken, loginUser } from '../api.js';

export const renderSettingsView = (container, { onSave }) => {
  const currentApiUrl = getBaseUrl();
  const currentToken = getAuthToken();
  const currentOrgId = localStorage.getItem('eventsphere_org_id') || '';
  const currentEventId = localStorage.getItem('eventsphere_event_id') || '';

  container.innerHTML = `
    <div class="context-bar glass-card">
      <h2 style="font-size: 1.25rem; font-weight: 700; color: #fff;">Application & API Settings</h2>
      <span style="font-size: 0.8rem; color: var(--text-muted)">Configure API Base URL, JWT Tokens, and Test Login Accounts</span>
    </div>

    <div class="settings-grid">
      <!-- Quick Test Accounts Login Box -->
      <div class="glass-card settings-card">
        <div class="card-title" style="margin-bottom: 0.75rem;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          Quick Test Accounts Login
        </div>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
          Login as pre-seeded roles to automatically configure organization and event context:
        </p>
        
        <div class="btn-group-stacked">
          <button id="btn-settings-login-admin" class="btn btn-outline btn-sm">
            Login as Admin (Full Control)
          </button>
          <button id="btn-settings-login-org" class="btn btn-outline btn-sm">
            Login as Organizer
          </button>
          <button id="btn-settings-login-part" class="btn btn-outline btn-sm">
            Login as Participant
          </button>
        </div>
      </div>

      <!-- Connection & Context Config Box -->
      <div class="glass-card settings-card">
        <div class="card-title" style="margin-bottom: 1rem;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          Backend API & Token Parameters
        </div>

        <div class="form-group">
          <label for="input-set-api-url">Backend Base URL</label>
          <input type="text" id="input-set-api-url" class="form-control" value="${escapeHtml(currentApiUrl)}" />
        </div>

        <div class="form-group">
          <label for="input-set-auth-token">JWT Bearer Token</label>
          <textarea id="input-set-auth-token" class="form-control" rows="3" placeholder="Paste your JWT token here">${escapeHtml(currentToken)}</textarea>
        </div>

        <div class="form-row">
          <div class="form-group col">
            <label for="input-set-org-id">Active Organization ID</label>
            <input type="text" id="input-set-org-id" class="form-control" value="${escapeHtml(currentOrgId)}" placeholder="e.g. 64a..." />
          </div>
          <div class="form-group col">
            <label for="input-set-event-id">Active Event ID</label>
            <input type="text" id="input-set-event-id" class="form-control" value="${escapeHtml(currentEventId)}" placeholder="e.g. 64b..." />
          </div>
        </div>

        <div style="margin-top: 1.25rem;">
          <button id="btn-save-settings" class="btn btn-primary">
            Save Settings & Refresh
          </button>
        </div>
      </div>
    </div>
  `;

  const handleLogin = async (email, password) => {
    try {
      const btn = container.querySelector('#btn-save-settings');
      if (btn) btn.disabled = true;
      await loginUser(email, password);
      alert(`Successfully logged in as ${email}!`);
      renderSettingsView(container, { onSave });
      if (onSave) onSave();
    } catch (err) {
      alert(`Login failed: ${err.message}`);
    }
  };

  container.querySelector('#btn-settings-login-admin')?.addEventListener('click', () => handleLogin('admin@example.com', 'Password123!'));
  container.querySelector('#btn-settings-login-org')?.addEventListener('click', () => handleLogin('organizer@example.com', 'Password123!'));
  container.querySelector('#btn-settings-login-part')?.addEventListener('click', () => handleLogin('participant@example.com', 'Password123!'));

  container.querySelector('#btn-save-settings')?.addEventListener('click', () => {
    const url = container.querySelector('#input-set-api-url').value.trim();
    const token = container.querySelector('#input-set-auth-token').value.trim();
    const orgId = container.querySelector('#input-set-org-id').value.trim();
    const eventId = container.querySelector('#input-set-event-id').value.trim();

    setBaseUrl(url);
    setAuthToken(token);
    localStorage.setItem('eventsphere_org_id', orgId);
    localStorage.setItem('eventsphere_event_id', eventId);

    alert('Settings saved successfully!');
    if (onSave) onSave();
  });
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
