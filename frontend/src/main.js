// Main Application Entry Point & Route Controller

import { getAuthToken, setAuthToken, loginUser, fetchCurrentUser, fetchMyOrganizations, fetchOrganizationEvents, createEvent } from './api.js';
import { renderLandingPage } from './components/landingPage.js';
import { renderDashboardView } from './components/dashboardView.js';
import { renderEventsView } from './components/eventsView.js';
import { renderAnalyticsDashboard } from './components/analyticsDashboard.js';
import { renderInsightsView } from './components/insightsView.js';
import { renderRecommendationsHub } from './components/recommendationsHub.js';
import { renderOrganizationView } from './components/organizationView.js';
import { renderSettingsView } from './components/settingsView.js';

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const brandHome = document.getElementById('brand-home-click');
  const navItems = document.querySelectorAll('.nav-item');
  
  const viewLanding = document.getElementById('view-landing');
  const viewDashboard = document.getElementById('view-dashboard');
  const viewEvents = document.getElementById('view-events');
  const viewAnalytics = document.getElementById('view-analytics');
  const viewInsights = document.getElementById('view-insights');
  const viewRecommendations = document.getElementById('view-recommendations');
  const viewOrganization = document.getElementById('view-organization');
  const viewSettings = document.getElementById('view-settings');

  const viewsMap = {
    landing: viewLanding,
    dashboard: viewDashboard,
    events: viewEvents,
    analytics: viewAnalytics,
    insights: viewInsights,
    recommendations: viewRecommendations,
    organization: viewOrganization,
    settings: viewSettings
  };

  const btnTopbarLogin = document.getElementById('btn-topbar-login');
  const userProfileBadge = document.getElementById('user-profile-badge');
  const lblUserName = document.getElementById('lbl-user-name');
  const lblUserAvatar = document.getElementById('lbl-user-avatar');
  const btnLogout = document.getElementById('btn-logout');

  const globalContextBar = document.getElementById('global-context-bar');
  const lblActiveOrgName = document.getElementById('lbl-active-org-name');
  const lblActiveEventName = document.getElementById('lbl-active-event-name');

  // Modals
  const modalAuth = document.getElementById('modal-auth');
  const btnCloseAuthModal = document.getElementById('btn-close-auth-modal');
  const formAuthLogin = document.getElementById('form-auth-login');
  const inputLoginEmail = document.getElementById('input-login-email');
  const inputLoginPassword = document.getElementById('input-login-password');

  const btnQuickAdmin = document.getElementById('btn-quick-admin');
  const btnQuickOrg = document.getElementById('btn-quick-org');
  const btnQuickPart = document.getElementById('btn-quick-part');

  const modalCreateEvent = document.getElementById('modal-global-create-event');
  const btnCloseCreateEvent = document.getElementById('btn-close-create-event');
  const formCreateEvent = document.getElementById('form-global-create-event');

  let activeView = 'landing';
  let currentUser = null;

  // View Navigation System
  const navigateTo = (viewName) => {
    activeView = viewName;

    // Update Sidebar Navigation active state
    navItems.forEach(item => {
      if (item.getAttribute('data-view') === viewName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Hide all view containers and reveal target
    Object.keys(viewsMap).forEach(key => {
      if (viewsMap[key]) {
        if (key === viewName) {
          viewsMap[key].classList.remove('hidden');
        } else {
          viewsMap[key].classList.add('hidden');
        }
      }
    });

    renderActiveView();
  };

  // Render current active view
  const renderActiveView = async () => {
    const orgId = localStorage.getItem('eventsphere_org_id') || '';
    const eventId = localStorage.getItem('eventsphere_event_id') || '';

    updateContextBarUI(orgId, eventId);

    switch (activeView) {
      case 'landing':
        renderLandingPage(viewLanding, {
          onGetStarted: () => {
            if (getAuthToken()) {
              navigateTo('dashboard');
            } else {
              openAuthModal();
            }
          },
          onExplore: () => navigateTo('dashboard')
        });
        break;

      case 'dashboard':
        renderDashboardView(viewDashboard, {
          orgId,
          eventId,
          onNavigate: navigateTo,
          onOpenCreateEvent: openCreateEventModal
        });
        break;

      case 'events':
        renderEventsView(viewEvents, {
          orgId,
          onNavigate: navigateTo,
          onOpenCreateEvent: openCreateEventModal
        });
        break;

      case 'analytics':
        renderAnalyticsDashboard(viewAnalytics, {
          orgId,
          eventId,
          onOpenConfig: () => navigateTo('settings')
        });
        break;

      case 'insights':
        renderInsightsView(viewInsights, {
          orgId,
          eventId,
          onNavigate: navigateTo,
          onOpenConfig: () => navigateTo('settings')
        });
        break;

      case 'recommendations':
        renderRecommendationsHub(viewRecommendations, {
          onOpenConfig: () => navigateTo('settings')
        });
        break;

      case 'organization':
        renderOrganizationView(viewOrganization, {
          currentOrgId: orgId,
          onOrgSelect: (selectedOrgId) => {
            localStorage.setItem('eventsphere_org_id', selectedOrgId);
            renderActiveView();
          },
          onNavigate: navigateTo
        });
        break;

      case 'settings':
        renderSettingsView(viewSettings, {
          onSave: () => {
            checkAuthAndUser();
            renderActiveView();
          }
        });
        break;
    }
  };

  // Update Global Context Indicator Bar
  const updateContextBarUI = async (orgId, eventId) => {
    if (orgId && activeView !== 'landing') {
      globalContextBar.classList.remove('hidden');
      try {
        const orgs = await fetchMyOrganizations();
        const foundOrg = orgs.find(item => (item.organization?._id || item._id) === orgId);
        if (foundOrg) {
          lblActiveOrgName.textContent = foundOrg.organization?.name || foundOrg.name || orgId.substring(0, 8);
        } else {
          lblActiveOrgName.textContent = orgId.substring(0, 8);
        }
      } catch (e) {
        lblActiveOrgName.textContent = orgId.substring(0, 8);
      }

      if (eventId) {
        try {
          const events = await fetchOrganizationEvents(orgId);
          const foundEvt = events.find(e => e._id === eventId);
          if (foundEvt) {
            lblActiveEventName.textContent = foundEvt.title;
          } else {
            lblActiveEventName.textContent = eventId.substring(0, 8);
          }
        } catch (e) {
          lblActiveEventName.textContent = eventId.substring(0, 8);
        }
      } else {
        lblActiveEventName.textContent = 'None';
      }
    } else {
      globalContextBar.classList.add('hidden');
    }
  };

  // Auth User check
  const checkAuthAndUser = async () => {
    const token = getAuthToken();
    if (token) {
      try {
        const data = await fetchCurrentUser();
        if (data?.user) {
          currentUser = data.user;
          lblUserName.textContent = currentUser.name || currentUser.email;
          lblUserAvatar.textContent = (currentUser.name || currentUser.email).charAt(0).toUpperCase();
          userProfileBadge.classList.remove('hidden');
          btnTopbarLogin.classList.add('hidden');
        }
      } catch (err) {
        console.warn('Current user check note:', err.message);
        userProfileBadge.classList.add('hidden');
        btnTopbarLogin.classList.remove('hidden');
      }
    } else {
      userProfileBadge.classList.add('hidden');
      btnTopbarLogin.classList.remove('hidden');
    }
  };

  // Auth Modal Handlers
  const openAuthModal = () => modalAuth.classList.remove('hidden');
  const closeAuthModal = () => modalAuth.classList.add('hidden');

  btnTopbarLogin.addEventListener('click', openAuthModal);
  btnCloseAuthModal.addEventListener('click', closeAuthModal);

  btnLogout.addEventListener('click', () => {
    setAuthToken('');
    currentUser = null;
    checkAuthAndUser();
    alert('Signed out successfully.');
    navigateTo('landing');
  });

  const handleQuickLogin = async (email, password) => {
    try {
      await loginUser(email, password);
      closeAuthModal();
      await checkAuthAndUser();
      alert(`Signed in as ${email}! Workspace context configured.`);
      navigateTo('dashboard');
    } catch (err) {
      alert(`Login failed: ${err.message}`);
    }
  };

  btnQuickAdmin?.addEventListener('click', () => handleQuickLogin('admin@example.com', 'Password123!'));
  btnQuickOrg?.addEventListener('click', () => handleQuickLogin('organizer@example.com', 'Password123!'));
  btnQuickPart?.addEventListener('click', () => handleQuickLogin('participant@example.com', 'Password123!'));

  formAuthLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = inputLoginEmail.value.trim();
    const password = inputLoginPassword.value.trim();
    if (!email || !password) return;
    await handleQuickLogin(email, password);
  });

  // Create Event Modal Handlers
  const openCreateEventModal = () => modalCreateEvent.classList.remove('hidden');
  const closeCreateEventModal = () => modalCreateEvent.classList.add('hidden');

  btnCloseCreateEvent.addEventListener('click', closeCreateEventModal);

  formCreateEvent.addEventListener('submit', async (e) => {
    e.preventDefault();
    const orgId = localStorage.getItem('eventsphere_org_id');
    if (!orgId) {
      alert('Please select or create an organization first.');
      return;
    }

    const title = document.getElementById('evt-title').value.trim();
    const description = document.getElementById('evt-desc').value.trim();
    const category = document.getElementById('evt-category').value;
    const locationType = document.getElementById('evt-location-type').value;
    const capacity = parseInt(document.getElementById('evt-capacity').value, 10);
    const status = document.getElementById('evt-status').value;
    const startDateVal = document.getElementById('evt-start-date').value;
    const endDateVal = document.getElementById('evt-end-date').value;

    const startDate = startDateVal ? new Date(startDateVal).toISOString() : new Date(Date.now() + 86400000).toISOString();
    const endDate = endDateVal ? new Date(endDateVal).toISOString() : new Date(Date.now() + 172800000).toISOString();

    try {
      const newEvt = await createEvent(orgId, {
        title,
        description,
        category,
        locationType,
        capacity,
        status,
        startDate,
        endDate
      });

      if (newEvt?._id) {
        localStorage.setItem('eventsphere_event_id', newEvt._id);
        alert(`Event "${title}" created successfully!`);
        closeCreateEventModal();
        renderActiveView();
      }
    } catch (err) {
      alert(`Failed to create event: ${err.message}`);
    }
  });

  // Sidebar navigation click listeners
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const targetView = e.currentTarget.getAttribute('data-view');
      if (targetView) {
        navigateTo(targetView);
      }
    });
  });

  brandHome.addEventListener('click', () => navigateTo('landing'));

  // Initial Load
  checkAuthAndUser();
  navigateTo('landing');
});
