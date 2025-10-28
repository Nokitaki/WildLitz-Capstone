// src/services/analyticsService.js - REPLACE ENTIRE FILE
import { API_BASE_URL } from '../config/api';

const API_ANALYTICS_URL = `${API_BASE_URL}/api/analytics`;

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('access_token');
};

// Helper function to make authenticated requests
// In analyticsService.js - Replace the authenticatedFetch function with this:

const authenticatedFetch = async (url, options = {}) => {
  const token = getAuthToken();
  
  if (!token) {
    console.warn('No authentication token found. User may not be logged in.');
    return null;
  }
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    if (response.status === 401) {
      const refreshed = await refreshAuthToken();
      if (refreshed) {
        return authenticatedFetch(url, options);
      } else {
        console.error('Session expired. Please log in again.');
        return null;
      }
    }
    
    if (!response.ok) {
      // READ THE ERROR RESPONSE
      const errorData = await response.json();
      console.error('API Error Response:', errorData);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Helper function to refresh auth token
const refreshAuthToken = async () => {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return false;
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('access_token', data.access);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
};

// FALLBACK: localStorage functions for non-authenticated users
const localStorageService = {
  STORAGE_KEY: 'vanishing_game_sessions',
  MAX_SESSIONS: 50,
  
  saveSessions(sessions) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },
  
  getSessions() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return [];
    }
  },
  
  clearSessions() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};

export const analyticsService = {
  /**
   * Save a game session to the database
   */
  async saveSession(sessionData) {
    try {
      const token = getAuthToken();
      
      // If not authenticated, use localStorage
      if (!token) {
        console.log('Not authenticated, using localStorage');
        const sessions = localStorageService.getSessions();
        const newSession = {
          ...sessionData,
          id: Date.now(),
          timestamp: new Date().toISOString()
        };
        sessions.unshift(newSession);
        const trimmedSessions = sessions.slice(0, localStorageService.MAX_SESSIONS);
        localStorageService.saveSessions(trimmedSessions);
        return newSession;
      }
      
      // Convert field names to match Django model (camelCase to snake_case)
const dbSessionData = {
  challenge_level: sessionData.challengeLevel || 'simple_words',
  learning_focus: sessionData.learningFocus || 'short_vowels',
  difficulty: sessionData.difficulty || 'easy',
  words_attempted: Number(sessionData.wordsAttempted) || 0,
  words_recognized: Number(sessionData.wordsRecognized) || 0,
  success_rate: Number(sessionData.successRate) || 0,
  average_response_time: Number(sessionData.averageResponseTime) || 0,
  max_streak: Number(sessionData.maxStreak) || 0,
  time_spent: Number(sessionData.timeSpent) || 0,
  pattern_stats: sessionData.patternStats || {},
  word_list: sessionData.wordList || []
};

// Validate: ensure no NaN values
if (isNaN(dbSessionData.average_response_time)) {
  dbSessionData.average_response_time = 0;
}
if (isNaN(dbSessionData.success_rate)) {
  dbSessionData.success_rate = 0;
}

console.log('Saving session to database:', dbSessionData);
// Save to database
const response = await authenticatedFetch(`${API_ANALYTICS_URL}/game-sessions/`, {
  method: 'POST',
  body: JSON.stringify(dbSessionData),  // Changed from sessionData to dbSessionData
});
      
      if (response) {
        console.log('Session saved to database successfully');
        return response;
      }
      
      // Fallback to localStorage if API fails
      console.warn('API save failed, using localStorage fallback');
      return this.saveSessionToLocalStorage(sessionData);
      
    } catch (error) {
      console.error('Error saving session:', error);
      return this.saveSessionToLocalStorage(sessionData);
    }
  },
  
  saveSessionToLocalStorage(sessionData) {
    const sessions = localStorageService.getSessions();
    const newSession = {
      ...sessionData,
      id: Date.now(),
      timestamp: new Date().toISOString()
    };
    sessions.unshift(newSession);
    const trimmedSessions = sessions.slice(0, localStorageService.MAX_SESSIONS);
    localStorageService.saveSessions(trimmedSessions);
    return newSession;
  },
  
  /**
   * Get all sessions for the current user
   */
 /**
 * Get all sessions for the current user
 */
async getSessions() {
  try {
    const token = getAuthToken();
    
    if (!token) {
      console.log('Not authenticated, using localStorage');
      return localStorageService.getSessions();
    }
    
    const response = await authenticatedFetch(`${API_ANALYTICS_URL}/game-sessions/`);
    
    // FIX: Ensure we always return an array
    if (response) {
      if (Array.isArray(response)) {
        return response;
      } else if (response.results && Array.isArray(response.results)) {
        // Handle paginated response
        return response.results;
      }
    }
    
    // Fallback to localStorage
    return localStorageService.getSessions();
    
  } catch (error) {
    console.error('Error loading sessions:', error);
    return localStorageService.getSessions();
  }
},
  
  /**
   * Get sessions within a date range
   */
  async getSessionsByDateRange(startDate, endDate) {
    try {
      const token = getAuthToken();
      
      if (!token) {
        const sessions = localStorageService.getSessions();
        return sessions.filter(session => {
          const sessionDate = new Date(session.timestamp);
          return sessionDate >= startDate && sessionDate <= endDate;
        });
      }
      
      const startISO = startDate.toISOString();
      const endISO = endDate.toISOString();
      
      const response = await authenticatedFetch(
        `${API_ANALYTICS_URL}/game-sessions/date_range/?start_date=${startISO}&end_date=${endISO}`
      );
      
      if (response && Array.isArray(response)) {
        return response;
      }
      
      const sessions = localStorageService.getSessions();
      return sessions.filter(session => {
        const sessionDate = new Date(session.timestamp);
        return sessionDate >= startDate && sessionDate <= endDate;
      });
      
    } catch (error) {
      console.error('Error loading sessions by date range:', error);
      return [];
    }
  },
  
  /**
   * Get aggregate statistics
   */
  async getAggregateStats() {
    try {
      const token = getAuthToken();
      
      if (!token) {
        const sessions = localStorageService.getSessions();
        return this.calculateLocalStats(sessions);
      }
      
      const response = await authenticatedFetch(
        `${API_ANALYTICS_URL}/game-sessions/aggregate_stats/`
      );
      
      if (response) {
        return response;
      }
      
      const sessions = localStorageService.getSessions();
      return this.calculateLocalStats(sessions);
      
    } catch (error) {
      console.error('Error loading aggregate stats:', error);
      const sessions = localStorageService.getSessions();
      return this.calculateLocalStats(sessions);
    }
  },
  
  calculateLocalStats(sessions) {
    if (sessions.length === 0) {
      return {
        total_sessions: 0,
        total_attempted: 0,
        total_recognized: 0,
        avg_success_rate: 0,
        avg_response_time: 0,
        best_streak: 0,
        total_time_played: 0,
        pattern_data: {}
      };
    }

    const totalAttempted = sessions.reduce((sum, s) => sum + (s.words_attempted || s.wordsAttempted || 0), 0);
    const totalRecognized = sessions.reduce((sum, s) => sum + (s.words_recognized || s.wordsRecognized || 0), 0);
    const avgSuccessRate = sessions.reduce((sum, s) => sum + (s.success_rate || s.successRate || 0), 0) / sessions.length;
    const avgResponseTime = sessions.reduce((sum, s) => sum + (s.average_response_time || s.averageResponseTime || 0), 0) / sessions.length;
    const bestStreak = Math.max(...sessions.map(s => s.max_streak || s.maxStreak || 0));
    const totalTimePlayed = sessions.reduce((sum, s) => sum + (s.time_spent || s.timeSpent || 0), 0);

    const patternData = {};
    sessions.forEach(session => {
      const stats = session.pattern_stats || session.patternStats;
      if (stats) {
        Object.entries(stats).forEach(([pattern, data]) => {
          if (!patternData[pattern]) {
            patternData[pattern] = { attempted: 0, correct: 0, totalTime: 0, count: 0 };
          }
          patternData[pattern].attempted += data.attempted || 0;
          patternData[pattern].correct += data.correct || 0;
          patternData[pattern].totalTime += (data.averageTime || 0) * (data.attempted || 0);
          patternData[pattern].count++;
        });
      }
    });

    return {
      total_sessions: sessions.length,
      total_attempted: totalAttempted,
      total_recognized: totalRecognized,
      avg_success_rate: Math.round(avgSuccessRate),
      avg_response_time: avgResponseTime.toFixed(2),
      best_streak: bestStreak,
      total_time_played: totalTimePlayed,
      pattern_data: patternData
    };
  },
  
  /**
   * Clear all sessions
   */
  async clearAllSessions() {
    try {
      const token = getAuthToken();
      
      if (!token) {
        localStorageService.clearSessions();
        return true;
      }
      
      const response = await authenticatedFetch(
        `${API_ANALYTICS_URL}/game-sessions/clear_all/`,
        { method: 'DELETE' }
      );
      
      if (response) {
        console.log('All sessions cleared from database');
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('Error clearing sessions:', error);
      return false;
    }
  },
  
  /**
   * Export sessions as JSON
   */
  async exportSessions() {
    const sessions = await this.getSessions();
    const dataStr = JSON.stringify(sessions, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `game-analytics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
};

export default analyticsService;