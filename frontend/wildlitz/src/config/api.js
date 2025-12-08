
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';


export const API_ENDPOINTS = {
  API_BASE_URL: `${API_BASE_URL}/api`,
  AUTH: `${API_BASE_URL}/api/auth`,
  SYLLABIFICATION: `${API_BASE_URL}/api/syllabification`,
  PHONICS: `${API_BASE_URL}/api/phonics`,
  PHONEMICS: `${API_BASE_URL}/api/phonemics`,
  SENTENCE_FORMATION: `${API_BASE_URL}/api/sentence_formation`,
  STORY: `${API_BASE_URL}/api/sentence_formation/story`,
};


export const isDevelopment = () => {
  return import.meta.env.MODE === 'development';
};


if (isDevelopment()) {
  console.log('API Configuration:', {
    baseUrl: API_BASE_URL,
    mode: import.meta.env.MODE
  });
}