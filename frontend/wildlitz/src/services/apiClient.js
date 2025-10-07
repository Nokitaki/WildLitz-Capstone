// src/services/apiClient.js
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

// Create an axios instance with the base URL
const apiClient = axios.create({
  baseURL: API_ENDPOINTS.SYLLABIFICATION,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API functions for the syllable clapping game
const syllableApi = {
  // Get a word from Supabase with AI-generated content
  getWord: async (difficulty, categories = []) => {
    // Build query string for categories
    const categoryParams = categories.map(cat => `categories[]=${encodeURIComponent(cat)}`).join('&');
    const url = `/get-word-supabase/?difficulty=${difficulty}&${categoryParams}`;
    
    const response = await apiClient.get(url);
    return response.data;
  },
  
  // Check the syllable clapping answer and get AI feedback
  checkAnswer: async (wordData, clapCount) => {
    const response = await apiClient.post('/check-syllable-answer/', {
      word: wordData.word,
      syllables: wordData.syllables,
      clapCount: clapCount,
      correctCount: wordData.count
    });
    
    return response.data;
  },
  
  // Get pronunciation guidance for the demo screen
  getPronunciationGuide: async (word, syllables) => {
    const response = await apiClient.post('/get-syllable-pronunciation/', {
      word: word,
      syllables: syllables
    });
    
    return response.data;
  },
  
  // Generate any AI content on demand
  generateAiContent: async (type, data) => {
    const response = await apiClient.post('/generate-ai-content/', {
      type: type, // 'fun_fact', 'character_message', or 'pronunciation'
      ...data
    });
    
    return response.data;
  }
};

export default syllableApi;