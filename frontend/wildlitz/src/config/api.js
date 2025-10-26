// src/config/api.js
// Centralized API configuration for frontend

// Get API base URL from environment variable or use localhost as fallback
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Export specific API endpoints
export const API_ENDPOINTS = {
  API_BASE_URL: `${API_BASE_URL}/api`,
  AUTH: `${API_BASE_URL}/api/auth`,
  SYLLABIFICATION: `${API_BASE_URL}/api/syllabification`,
  PHONICS: `${API_BASE_URL}/api/phonics`,
  PHONEMICS: `${API_BASE_URL}/api/phonemics`,
  SENTENCE_FORMATION: `${API_BASE_URL}/api/sentence_formation`,
  STORY: `${API_BASE_URL}/api/sentence_formation/story`,
};

// Helper function to check if we're in development mode
export const isDevelopment = () => {
  return import.meta.env.MODE === 'development';
};

// Log API configuration in development
if (isDevelopment()) {
  console.log('API Configuration:', {
    baseUrl: API_BASE_URL,
    mode: import.meta.env.MODE
  });
}