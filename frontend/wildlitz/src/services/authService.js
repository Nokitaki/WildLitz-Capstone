// src/services/authService.js
import axios from 'axios';

// Configure base URL for your Django backend
const API_BASE_URL = 'http://localhost:8000/api';

// Create axios instance for auth requests
const authAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token to requests
authAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
authAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });

          const newAccessToken = response.data.access;
          localStorage.setItem('access_token', newAccessToken);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return authAPI(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/'; // Redirect to landing page
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authService = {
  // Authentication endpoints
  async login(email, password) {
    const response = await authAPI.post('/auth/login/', {
      username: email, // Django expects 'username' field
      password,
    });
    return response.data;
  },

  async register(email, password, firstName, lastName = '') {
    const response = await authAPI.post('/auth/register/', {
      email,
      password,
      first_name: firstName,
      last_name: lastName,
    });
    return response.data;
  },

  async refreshToken(refreshToken) {
    const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
      refresh: refreshToken,
    });
    return response.data;
  },

  async getProfile() {
    const response = await authAPI.get('/auth/me/');
    return response.data;
  },

  // Progress and analytics endpoints
  async getUserProgress(module = null) {
    const url = module ? `/progress/?module=${module}` : '/progress/';
    const response = await authAPI.get(url);
    return response.data;
  },

  async getUserAnalytics() {
    const response = await authAPI.get('/analytics/');
    return response.data;
  },

  async logActivity(activityData) {
    const response = await authAPI.post('/progress/log/', activityData);
    return response.data;
  },

  // Utility functions
  setAuthHeader(token) {
    authAPI.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },

  clearAuthHeader() {
    delete authAPI.defaults.headers.common['Authorization'];
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('access_token');
  },

  // Get stored token
  getToken() {
    return localStorage.getItem('access_token');
  },
};

// Export configured axios instance for use in game components
export const apiClient = authAPI;

// Export a function to create authenticated requests for existing game code
export const createAuthenticatedRequest = () => {
  const token = localStorage.getItem('access_token');
  return axios.create({
    baseURL: API_BASE_URL.replace('/api', ''), // Remove /api for full backend URL
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
};