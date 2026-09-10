// Organization Management View Component for EventSphere AI

import { fetchMyOrganizations, createOrganization } from '../api.js';

export const renderOrganizationView = async (container, { currentOrgId, onOrgSelect, onNavigate }) => {
  container.innerHTML = `
    <div class="state-container">
      <div class="spinner"></div>
      <h3>Loading Organizations...</h3>
    </div>
  `;

  try {
    const orgs = await fetchMyOrganizations();

    container.innerHTML = `
      <div class="context-bar glass-card">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <h2 style="font-size: 1.25rem; font-weight: 700; color: #fff;">My Organizations</h2>
          <span style="font-size: 0.8rem; color: var(--text-muted)">(${orgs.length} Member Organizations)</span>
        </div>
        <button id="btn-create-org-open" class="btn btn-primary btn-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Create New Organization
        </button>
      </div>

      <!-- Organizations Cards Grid -->
      ${orgs.length > 0 ? `
        <div class="orgs-cards-grid">
          ${orgs.map(item => {
            const org = item.organization || item;
            const isSelected = org._id === currentOrgId;
            const role = item.role || 'MEMBER';
            return `
              <div class="glass-card org-item-card ${isSelected ? 'selected' : ''}">
                <div class="org-card-header">
                  <span class="role-badge ${role.toLowerCase()}">${escapeHtml(role)}</span>
                  ${isSelected ? `<span class="active-tag">Active Context</span>` : ''}
                </div>
                
                <h3 class="org-name">${escapeHtml(org.name)}</h3>
                <p class="org-desc">${escapeHtml(org.description || 'No description provided.')}</p>

                <div class="org-footer">
                  <span style="font-size: 0.75rem; color: var(--text-subtle)">Joined: ${new Date(item.joinedAt || Date.now()).toLocaleDateString()}</span>
                  ${!isSelected ? `
                    <button class="btn btn-secondary btn-xs btn-select-org" data-org-id="${org._id}">
                      Select Organization
                    </button>
                  ` : `
                    <button class="btn btn-primary btn-xs" disabled>
                      Selected
                    </button>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : `
        <div class="empty-state-box glass-card">
          <p style="color: var(--text-muted)">You do not belong to any organizations yet.</p>
        </div>
      `}

      <!-- Create Organization Modal -->
      <div id="modal-create-org" class="modal-backdrop hidden">
        <div class="modal-card">
          <div class="modal-header">
            <h3>Create Organization</h3>
            <button id="btn-close-org-modal" class="btn-close">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label for="input-new-org-name">Organization Name</label>
              <input type="text" id="input-new-org-name" class="form-control" placeholder="e.g. Apex Tech Group" />
            </div>
            <div class="form-group">
              <label for="input-new-org-desc">Description</label>
              <textarea id="input-new-org-desc" class="form-control" rows="3" placeholder="Brief description..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button id="btn-submit-create-org" class="btn btn-primary">Create Organization</button>
          </div>
        </div>
      </div>
    `;

    container.querySelectorAll('.btn-select-org').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-org-id');
        if (id) {
          onOrgSelect(id);
        }
      });
    });

    const modal = container.querySelector('#modal-create-org');
    container.querySelector('#btn-create-org-open')?.addEventListener('click', () => {
      modal.classList.remove('hidden');
    });
    container.querySelector('#btn-close-org-modal')?.addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    container.querySelector('#btn-submit-create-org')?.addEventListener('click', async () => {
      const nameInput = container.querySelector('#input-new-org-name');
      const descInput = container.querySelector('#input-new-org-desc');
      const name = nameInput.value.trim();
      const desc = descInput.value.trim();

      if (!name) {
        alert('Please enter an organization name.');
        return;
      }

      try {
        const result = await createOrganization(name, desc);
        alert('Organization created successfully!');
        modal.classList.add('hidden');
        if (result?.organization?._id) {
          onOrgSelect(result.organization._id);
        } else {
          renderOrganizationView(container, { currentOrgId, onOrgSelect, onNavigate });
        }
      } catch (err) {
        alert(`Failed to create organization: ${err.message}`);
      }
    });

  } catch (err) {
    container.innerHTML = `
      <div class="state-container glass-card">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--status-danger)" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <h3>Failed to Load Organizations</h3>
        <p style="color: var(--text-muted)">${escapeHtml(err.message || 'Request failed')}</p>
      </div>
    `;
  }
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
