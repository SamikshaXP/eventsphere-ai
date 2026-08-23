// Main Application Entry Point

import { getBaseUrl, setBaseUrl, getAuthToken, setAuthToken, loginUser } from './api.js';
import { renderAnalyticsDashboard } from './components/analyticsDashboard.js';
import { renderRecommendationsHub } from './components/recommendationsHub.js';

document.addEventListener('DOMContentLoaded', () => {
  const tabAnalytics = document.getElementById('tab-analytics');
  const tabRecommendations = document.getElementById('tab-recommendations');
  const viewAnalytics = document.getElementById('view-analytics');
  const viewRecommendations = document.getElementById('view-recommendations');

  const btnConfig = document.getElementById('btn-config');
  const modalConfig = document.getElementById('modal-config');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnSaveConfig = document.getElementById('btn-save-config');

  const inputApiUrl = document.getElementById('input-api-url');
  const inputAuthToken = document.getElementById('input-auth-token');
  const inputOrgId = document.getElementById('input-org-id');
  const inputEventId = document.getElementById('input-event-id');

  const btnQuickLoginAdmin = document.getElementById('btn-quick-login-admin');
  const btnQuickLoginOrg = document.getElementById('btn-quick-login-org');
  const btnQuickLoginPart = document.getElementById('btn-quick-login-part');

  let activeView = 'analytics';

  // Initialize Modal Values
  const initModalValues = () => {
    inputApiUrl.value = getBaseUrl();
    inputAuthToken.value = getAuthToken();
    inputOrgId.value = localStorage.getItem('eventsphere_org_id') || '';
    inputEventId.value = localStorage.getItem('eventsphere_event_id') || '';
  };

  const openConfigModal = () => {
    initModalValues();
    modalConfig.classList.remove('hidden');
  };

  const closeModal = () => {
    modalConfig.classList.add('hidden');
  };

  btnConfig.addEventListener('click', openConfigModal);
  btnCloseModal.addEventListener('click', closeModal);

  btnSaveConfig.addEventListener('click', () => {
    setBaseUrl(inputApiUrl.value.trim());
    setAuthToken(inputAuthToken.value.trim());
    localStorage.setItem('eventsphere_org_id', inputOrgId.value.trim());
    localStorage.setItem('eventsphere_event_id', inputEventId.value.trim());
    closeModal();
    refreshActiveView();
  });

  // Quick Login Actions for testing against backend
  const handleQuickLogin = async (email, password) => {
    try {
      btnSaveConfig.disabled = true;
      btnSaveConfig.textContent = 'Logging in...';
      await loginUser(email, password);
      initModalValues();
      alert(`Login successful as ${email}! Organization and Event IDs configured.`);
    } catch (err) {
      alert(`Login failed: ${err.message}`);
    } finally {
      btnSaveConfig.disabled = false;
      btnSaveConfig.textContent = 'Save Settings & Refresh';
    }
  };

  btnQuickLoginAdmin?.addEventListener('click', () => handleQuickLogin('admin@example.com', 'Password123!'));
  btnQuickLoginOrg?.addEventListener('click', () => handleQuickLogin('organizer@example.com', 'Password123!'));
  btnQuickLoginPart?.addEventListener('click', () => handleQuickLogin('participant@example.com', 'Password123!'));

  // View Navigation
  const switchView = (viewName) => {
    activeView = viewName;
    if (viewName === 'analytics') {
      tabAnalytics.classList.add('active');
      tabRecommendations.classList.remove('active');
      viewAnalytics.classList.remove('hidden');
      viewRecommendations.classList.add('hidden');
    } else {
      tabRecommendations.classList.add('active');
      tabAnalytics.classList.remove('active');
      viewRecommendations.classList.remove('hidden');
      viewAnalytics.classList.add('hidden');
    }
    refreshActiveView();
  };

  tabAnalytics.addEventListener('click', () => switchView('analytics'));
  tabRecommendations.addEventListener('click', () => switchView('recommendations'));

  // Refresh current active view
  const refreshActiveView = () => {
    const orgId = localStorage.getItem('eventsphere_org_id') || '';
    const eventId = localStorage.getItem('eventsphere_event_id') || '';

    if (activeView === 'analytics') {
      renderAnalyticsDashboard(viewAnalytics, { orgId, eventId, onOpenConfig: openConfigModal });
    } else {
      renderRecommendationsHub(viewRecommendations, { onOpenConfig: openConfigModal });
    }
  };

  // Initial Load
  initModalValues();
  refreshActiveView();
});
