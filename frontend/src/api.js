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
    const errorMsg = data?.message || data?.error || `HTTP ${response.status}: Request failed`;
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

// Helper Login API
export const loginUser = async (email, password) => {
  const result = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  if (result?.data?.token) {
    setAuthToken(result.data.token);
  }
  return result.data;
};
