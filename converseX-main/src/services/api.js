// ==============================================
// API SERVICE - CONNECTS FRONTEND TO BACKEND
// ==============================================
// This file handles all HTTP requests to the backend
// It uses Axios library to make API calls

import axios from 'axios';

// STEP 1: Get backend URL from environment variable
// During development: http://localhost:5000/api
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// STEP 2: Create axios instance with default settings
const api = axios.create({
  baseURL: API_URL,           // Base URL for all requests
  headers: {
    'Content-Type': 'application/json',  // Send JSON data
  },
});

// STEP 3: Add token to every request automatically
// This runs before every request is sent
api.interceptors.request.use((config) => {
  // Get login token from browser storage
  const token = localStorage.getItem('token');
  
  // If token exists, add it to request header
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;  // Send the request
});

// STEP 4: Handle errors automatically
// This runs after every response is received
api.interceptors.response.use(
  // If response is successful, just return it
  (response) => response,
  
  // If there's an error, handle it
  (error) => {
    // If error is 401 (Unauthorized), user needs to login again
    if (error.response?.status === 401) {
      // Remove old token
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==============================================
// AUTHENTICATION API CALLS
// ==============================================
export const authAPI = {
  // Register new user
  register: (userData) => {
    // POST request to /api/auth/register
    return api.post('/auth/register', userData);
  },
  
  // Login user
  login: (credentials) => {
    // POST request to /api/auth/login
    return api.post('/auth/login', credentials);
  },
  
  // Get current logged-in user info
  getCurrentUser: () => {
    // GET request to /api/auth/me
    return api.get('/auth/me');
  },
  
  // Logout user
  logout: () => {
    // POST request to /api/auth/logout
    return api.post('/auth/logout');
  },

  // Update profile (avatar/status)
  updateProfile: (data) => {
    return api.put('/auth/profile', data);
  },

  // Update a preference section
  updatePreferences: (section, data) => {
    return api.put(`/auth/preferences/${section}`, data);
  },
};

// ==============================================
// COMMUNITY API CALLS
// ==============================================
export const communityAPI = {
  // Get all communities user is part of
  getAll: () => {
    return api.get('/communities');
  },
  
  // Get specific community by ID
  getById: (id) => {
    return api.get(`/communities/${id}`);
  },
  
  // Create new community
  create: (data) => {
    return api.post('/communities', data);
  },
  
  // Join a community
  join: (id) => {
    return api.post(`/communities/${id}/join`);
  },
  
  // Leave a community
  leave: (id) => {
    return api.post(`/communities/${id}/leave`);
  },
  
  // Delete a community (only owner can do this)
  delete: (id) => {
    return api.delete(`/communities/${id}`);
  },
};

// ==============================================
// CHANNEL API CALLS
// ==============================================
export const channelAPI = {
  // Get all channels in a community
  getByCommunity: (communityId) => {
    return api.get(`/channels/community/${communityId}`);
  },
  
  // Get specific channel by ID
  getById: (id) => {
    return api.get(`/channels/${id}`);
  },
  
  // Create new channel
  create: (data) => {
    return api.post('/channels', data);
  },
  
  // Delete a channel
  delete: (id) => {
    return api.delete(`/channels/${id}`);
  },
};

// ==============================================
// MESSAGE API CALLS
// ==============================================
export const messageAPI = {
  // Get messages in a channel
  getByChannel: (channelId, limit = 50, skip = 0) => {
    return api.get(`/messages/channel/${channelId}?limit=${limit}&skip=${skip}`);
  },
  
  // Send a new message
  send: (data) => {
    return api.post('/messages', data);
  },
  
  // Edit an existing message
  edit: (id, content) => {
    return api.put(`/messages/${id}`, { content });
  },
  
  // Delete a message
  delete: (id) => {
    return api.delete(`/messages/${id}`);
  },
};

// ==============================================
// MEETING API CALLS
// ==============================================
export const meetingAPI = {
  // Get meetings in a community
  getByCommunity: (communityId) => {
    return api.get(`/meetings/community/${communityId}`);
  },
  
  // Create new meeting
  create: (data) => {
    return api.post('/meetings', data);
  },
  
  // Join a meeting
  join: (meetingId) => {
    return api.post(`/meetings/${meetingId}/join`);
  },
  
  // Update meeting status
  updateStatus: (meetingId, status) => {
    return api.patch(`/meetings/${meetingId}/status`, { status });
  },
  
  // Delete a meeting
  delete: (meetingId) => {
    return api.delete(`/meetings/${meetingId}`);
  },
};

// Export default api instance
export default api;
