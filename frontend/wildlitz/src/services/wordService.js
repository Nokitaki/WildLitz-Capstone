// src/services/wordService.js
import { API_ENDPOINTS } from '../config/api';

/**
 * Fetches a syllable word from the backend based on difficulty and categories
 * @param {string} difficulty - Difficulty level (easy, medium, hard)
 * @param {Array} categories - Array of category names
 * @returns {Promise} - Promise resolving to word data
 */
export const fetchSyllableWord = async (difficulty = 'medium', categories = []) => {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    params.append('difficulty', difficulty);
    categories.forEach(cat => params.append('categories[]', cat));
    
    // Make the request
    const response = await fetch(`${API_ENDPOINTS.SYLLABIFICATION}/get-word-supabase/?${params}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch word: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching word:', error);
    throw error;
  }
};

/**
 * Checks a syllable clapping answer
 * @param {Object} wordData - Current word data
 * @param {number} clapCount - Number of claps from the user
 * @returns {Promise} - Promise resolving to feedback data
 */
export const checkSyllableAnswer = async (wordData, clapCount) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.SYLLABIFICATION}/check-clapping/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        word: wordData.word,
        clap_count: clapCount,
        syllable_breakdown: wordData.syllables
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to check answer');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error checking answer:', error);
    // Return a basic response if the API call fails
    return {
      is_correct: clapCount === wordData.count,
      correct_count: wordData.count,
      user_count: clapCount,
      feedback: clapCount === wordData.count 
        ? `Great job! "${wordData.word}" has ${wordData.count} syllables.`
        : `Nice try! "${wordData.word}" has ${wordData.count} syllables, not ${clapCount}.`
    };
  }
};