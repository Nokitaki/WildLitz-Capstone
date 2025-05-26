// src/services/soundSafariApi.js
const API_BASE_URL = 'http://localhost:8000/api/phonemics';  // Changed from soundsafari to phonemics

export const fetchSafariAnimals = async (params) => {
  try {
    const queryParams = new URLSearchParams({
      sound: params.sound,
      difficulty: params.difficulty,
      environment: params.environment,
      position: params.position
    });
    
    const response = await fetch(`${API_BASE_URL}/animals/?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching safari animals:', error);
    throw error;
  }
};

export const fetchRandomSound = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/random-sound/`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching random sound:', error);
    throw error;
  }
};

export const fetchSoundExamples = async (sound) => {
  try {
    const response = await fetch(`${API_BASE_URL}/sound-examples/?sound=${sound}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching sound examples:', error);
    throw error;
  }
};

export const submitGameResults = async (results) => {
  try {
    const response = await fetch(`${API_BASE_URL}/submit-results/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(results),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error submitting game results:', error);
    throw error;
  }
};