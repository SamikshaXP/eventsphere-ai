// API Service Client for EventSphere AI Backend

export const getBaseUrl = () => {
  return localStorage.getItem('eventsphere_api_url') || 'http://localhost:5000/api/v1';
};

export const setBaseUrl = (url) => {
  localStorage.setItem('eventsphere_api_url', url);
};

export const getAuthToken = () => {
  return localStorage.getItem('eventsphere_token') || '';
};

export const setAuthToken = (token) => {
  localStorage.setItem('eventsphere_token', token);
};

const apiRequest = async (endpoint, options = {}) => {
  const baseUrl = getBaseUrl();
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers
  });

  const contentType = response.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = null;
  }

  if (!response.ok) {
    const errorMsg =
      data?.message ||
      (typeof data?.error === 'string' ? data.error : data?.error?.message) ||
      `HTTP ${response.status}: Request failed`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
};

// Phase 1.8 API Functions
export const fetchEventAnalytics = async (orgId, eventId) => {
  const result = await apiRequest(`/organizations/${orgId}/events/${eventId}/analytics`);
  return result.data;
};

export const fetchOrganizerInsights = async (orgId, eventId) => {
  const result = await apiRequest(`/organizations/${orgId}/events/${eventId}/insights`);
  return result.data;
};

export const fetchUserRecommendations = async () => {
  const result = await apiRequest('/users/me/recommendations');
  return result.data?.recommendations || [];
};

export const fetchMyOrganizations = async () => {
  const result = await apiRequest('/organizations');
  return result?.data?.organizations || [];
};

export const fetchOrganizationEvents = async (orgId) => {
  const result = await apiRequest(`/organizations/${orgId}/events`);
  return result?.data?.events || [];
};

export const createOrganization = async (name, description = '') => {
  const result = await apiRequest('/organizations', {
    method: 'POST',
    body: JSON.stringify({ name, description })
  });
  return result?.data;
};

export const createEvent = async (orgId, eventData) => {
  const result = await apiRequest(`/organizations/${orgId}/events`, {
    method: 'POST',
    body: JSON.stringify(eventData)
  });
  return result?.data?.event;
};

export const fetchCurrentUser = async () => {
  const result = await apiRequest('/auth/me');
  return result?.data;
};

export const publishEvent = async (orgId, eventId) => {
  const result = await apiRequest(`/organizations/${orgId}/events/${eventId}/publish`, {
    method: 'POST'
  });
  return result?.data?.event;
};

export const cancelEvent = async (orgId, eventId) => {
  const result = await apiRequest(`/organizations/${orgId}/events/${eventId}/cancel`, {
    method: 'POST'
  });
  return result?.data?.event;
};

// Helper Login API
export const loginUser = async (email, password) => {
  const performLogin = async () => {
    try {
      const result = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      return result?.data;
    } catch (err) {
      if (err.status === 401) {
        // If user is not yet registered in MongoDB, attempt auto-registration and retry login
        const rawName = email.split('@')[0];
        const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1) + ' User';
        await apiRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name: formattedName, email, password })
        });
        const retryResult = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        return retryResult?.data;
      }
      throw err;
    }
  };

  const loginData = await performLogin();
  if (loginData?.token) {
    setAuthToken(loginData.token);

    try {
      let orgs = await fetchMyOrganizations();
      let selectedOrgId = '';
      let selectedEventId = '';

      if (orgs.length === 0) {
        const rawName = email.split('@')[0];
        const orgName = `${rawName.charAt(0).toUpperCase() + rawName.slice(1)} Organization`;
        const newOrgData = await createOrganization(orgName, 'Auto-generated organization');
        if (newOrgData?.organization?._id) {
          selectedOrgId = newOrgData.organization._id;
        }
      } else {
        selectedOrgId = orgs[0].organization?._id || orgs[0]._id;
      }

      if (selectedOrgId) {
        localStorage.setItem('eventsphere_org_id', selectedOrgId);
        let events = await fetchOrganizationEvents(selectedOrgId);
        if (events.length === 0) {
          const newEvt = await createEvent(selectedOrgId, {
            title: 'Sample Launch Event',
            description: 'Demonstration event for analytics and insights',
            category: 'Technology',
            startDate: new Date(Date.now() - 86400000).toISOString(),
            endDate: new Date(Date.now() + 172800000).toISOString(),
            locationType: 'ONLINE',
            capacity: 100,
            status: 'PUBLISHED'
          });
          if (newEvt?._id) {
            selectedEventId = newEvt._id;
          }
        } else {
          selectedEventId = events[0]._id;
        }

        if (selectedEventId) {
          localStorage.setItem('eventsphere_event_id', selectedEventId);
        }
      }
    } catch (setupErr) {
      console.warn('Auto organization/event setup note:', setupErr.message);
    }
  }

  return loginData;
};
