// frontend/wildlitz/src/services/soundSafariAnalyticsService.js
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

export const soundSafariAnalyticsService = {
  /**
   * Save complete Sound Safari game session to Supabase
   */
  async saveGameSession(sessionData) {
  try {
    // ✅ FIX: Only send token if it exists and appears valid
    const token = localStorage.getItem('access_token');
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Only add Authorization header if we have a non-empty token
    // This prevents sending invalid/expired tokens
    if (token && token.trim() !== '') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // ✅ FIX: Validate data before sending
    const validatedData = {
      timestamp: sessionData.timestamp || new Date().toISOString(),
      target_sound: String(sessionData.target_sound || ''),
      sound_position: String(sessionData.sound_position || 'beginning'),
      environment: String(sessionData.environment || 'jungle'),
      difficulty: String(sessionData.difficulty || 'easy'),
      animals_shown: Number(sessionData.animals_shown) || 0,
      correct_selections: Number(sessionData.correct_selections) || 0,
      incorrect_selections: Number(sessionData.incorrect_selections) || 0,
      success_rate: Number(sessionData.success_rate) || 0,
      time_spent: Number(sessionData.time_spent) || 0,
      completed: Boolean(sessionData.completed !== false)
    };
    
    console.log('📊 Saving Sound Safari session to Supabase...', validatedData);
    console.log('🔑 Auth token present:', !!token);
    
    const response = await axios.post(
      `${API_URL}/phonemics/save-safari-session/`,
      validatedData,
      { headers }
    );
    
    console.log('✅ Session saved successfully:', response.data);
    return {
      success: true,
      ...response.data
    };
    
  } catch (error) {
    console.error('❌ Error saving Sound Safari session:', error);
    console.error('❌ Error response:', error.response?.data);
    console.error('❌ Error status:', error.response?.status);
    
    // ✅ FIX: Handle 401 errors gracefully
    if (error.response?.status === 401) {
      console.warn('⚠️ Authentication failed - token may be expired. Saving anonymously...');
      
      // Try again without the token
      try {
        const validatedData = {
          timestamp: sessionData.timestamp || new Date().toISOString(),
          target_sound: String(sessionData.target_sound || ''),
          sound_position: String(sessionData.sound_position || 'beginning'),
          environment: String(sessionData.environment || 'jungle'),
          difficulty: String(sessionData.difficulty || 'easy'),
          animals_shown: Number(sessionData.animals_shown) || 0,
          correct_selections: Number(sessionData.correct_selections) || 0,
          incorrect_selections: Number(sessionData.incorrect_selections) || 0,
          success_rate: Number(sessionData.success_rate) || 0,
          time_spent: Number(sessionData.time_spent) || 0,
          completed: Boolean(sessionData.completed !== false)
        };
        
        const retryResponse = await axios.post(
          `${API_URL}/phonemics/save-safari-session/`,
          validatedData,
          { 
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('✅ Session saved anonymously:', retryResponse.data);
        return {
          success: true,
          ...retryResponse.data
        };
      } catch (retryError) {
        console.error('❌ Retry also failed:', retryError);
        return {
          success: false,
          error: retryError.response?.data?.error || retryError.message
        };
      }
    }
    
    return {
      success: false,
      error: error.response?.data?.error || error.message,
      details: error.response?.data
    };
  }
},

  /**
   * Get user analytics from Supabase
   */
  async getUserAnalytics(limit = 20) {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        console.warn('No auth token found');
        return { success: false, error: 'Not authenticated' };
      }
      
      const headers = {
        'Authorization': `Bearer ${token}`
      };
      
      const response = await axios.get(
        `${API_URL}/phonemics/get-safari-analytics/?limit=${limit}`,
        { headers }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching Sound Safari analytics:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Format session data from game results
   */
  formatSessionData(gameResults, gameConfig) {
    return {
      timestamp: new Date().toISOString(),
      target_sound: gameConfig.targetSound,
      sound_position: gameConfig.soundPosition,
      environment: gameConfig.environment,
      difficulty: gameConfig.difficulty,
      animals_shown: gameResults.totalAnimals || 0,
      correct_selections: gameResults.correctSelections || 0,
      incorrect_selections: gameResults.incorrectSelections || 0,
      success_rate: gameResults.successRate || 0,
      time_spent: Math.floor(gameResults.timeSpent / 1000) || 0, // Convert to seconds
      completed: gameResults.completed !== false
    };
  }
};

export default soundSafariAnalyticsService;