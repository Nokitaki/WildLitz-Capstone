// frontend/wildlitz/src/services/soundSafariAnalyticsService.js
// UPDATED: New structure with sessions and rounds

import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

export const soundSafariAnalyticsService = {
  /**
   * Save complete Sound Safari game session with all rounds
   * NEW: Sends session data with rounds array
   */
  async saveGameSession(sessionData) {
    try {
      const token = localStorage.getItem('access_token');
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Only add Authorization header if we have a valid token
      if (token && token.trim() !== '') {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Validate session data structure
      if (!sessionData.difficulty) {
        console.error('❌ Missing difficulty in session data');
        return { success: false, error: 'Missing difficulty' };
      }
      
      if (!sessionData.rounds || sessionData.rounds.length === 0) {
        console.error('❌ Missing or empty rounds array');
        return { success: false, error: 'Missing rounds data' };
      }
      
      // Validate each round has required fields
      for (const round of sessionData.rounds) {
        if (!round.round_number || !round.target_sound || !round.sound_position) {
          console.error('❌ Invalid round data:', round);
          return { success: false, error: 'Invalid round data structure' };
        }
      }
      
      console.log('📊 Saving Sound Safari session to Supabase...');
      console.log('Session difficulty:', sessionData.difficulty);
      console.log('Total rounds:', sessionData.rounds.length);
      console.log('🔑 Auth token present:', !!token);
      
      const response = await axios.post(
        `${API_URL}/phonemics/save-safari-session/`,
        sessionData,
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
      
      // Handle 401 errors gracefully
      if (error.response?.status === 401) {
        console.warn('⚠️ Authentication failed - trying to save anonymously...');
        
        try {
          // Retry without token for anonymous save
          const retryResponse = await axios.post(
            `${API_URL}/phonemics/save-safari-session/`,
            sessionData,
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
   * Get user analytics (sessions list only)
   * Use getSessionRounds() to get detailed round data for a session
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
   * Get detailed round data for a specific session
   * NEW: For drilling down into session details
   */
  async getSessionRounds(sessionId) {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        console.warn('No auth token found');
        return { success: false, error: 'Not authenticated' };
      }
      
      const headers = {
        'Authorization': `Bearer ${token}`
      };
      
      console.log('🔍 Fetching rounds for session:', sessionId);
      
      const response = await axios.get(
        `${API_URL}/phonemics/get-session-rounds/${sessionId}/`,
        { headers }
      );
      
      console.log('✅ Rounds fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching session rounds:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Format round data from game state
   * NEW: Creates round object for the rounds array
   */
  formatRoundData(roundNumber, gameConfig, roundResults) {
    return {
      round_number: roundNumber,
      target_sound: gameConfig.targetSound,
      sound_position: gameConfig.soundPosition,
      environment: gameConfig.environment,
      correct: roundResults.correctSelections || 0,
      incorrect: roundResults.incorrectSelections || 0,
      total: (roundResults.correctSelections || 0) + (roundResults.incorrectSelections || 0),
      time_spent: roundResults.timeSpent ? Math.floor(roundResults.timeSpent / 1000) : 0
    };
  },

  /**
   * Format complete session data from all rounds
   * NEW: Creates session object with rounds array
   */
  formatSessionData(gameConfig, allRounds, totalTimeSpent) {
    return {
      played_at: new Date().toISOString(),
      difficulty: gameConfig.difficulty,
      time_spent: Math.floor(totalTimeSpent / 1000),
      completed: true,
      rounds: allRounds
    };
  }
};

export default soundSafariAnalyticsService;