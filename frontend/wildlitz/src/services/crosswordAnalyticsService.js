// src/services/crosswordAnalyticsService.js
// Complete service for crossword game analytics
import { API_ENDPOINTS } from '../config/api';

class CrosswordAnalyticsService {
  /**
   * Create a new crossword game session
   */
  async createSession(sessionData) {
    try {
      const response = await fetch(`${API_ENDPOINTS.STORY}/session/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create session');
      }
      
      return data;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Update an existing session
   */
  async updateSession(sessionId, updates) {
    try {
      const response = await fetch(`${API_ENDPOINTS.STORY}/session/${sessionId}/update/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update session');
      }
      
      return data;
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  }

  /**
   * Log a game activity
   */
  async logActivity(activityData) {
    try {
      const response = await fetch(`${API_ENDPOINTS.STORY}/activity/log/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to log activity');
      }
      
      return data;
    } catch (error) {
      console.error('Error logging activity:', error);
      throw error;
    }
  }

  /**
   * Log when a word is solved (used by GameplayScreen)
   */
  async logWordSolved(sessionId, wordData, timeSpent = 0, hintsUsed = 0) {
    try {
      // Skip logging if no valid session ID
      if (!sessionId || sessionId === 'undefined' || sessionId === 'null') {
        console.log('⚠️ No session ID available, skipping word solved logging');
        return { success: false, skipped: true };
      }

      const activityData = {
        session_id: sessionId,
        activity_type: 'word_solved',
        word_data: typeof wordData === 'string' ? { word: wordData } : wordData,
        is_correct: true,
        time_spent_seconds: timeSpent,
        hint_count: hintsUsed,
        user_email: 'guest@wildlitz.com',
        episode_number: wordData?.episodeNumber || 1,
        puzzle_id: wordData?.puzzleId || 'unknown'
      };
      
      return await this.logActivity(activityData);
    } catch (error) {
      console.log('⚠️ Analytics logging skipped:', error.message);
      // Don't throw - fail silently for analytics
      return { success: false };
    }
  }

  /**
   * Log when a game is completed (used by SummaryScreen)
   */
  async logGameCompleted(sessionId, gameData) {
    try {
      // Skip logging if no valid session ID
      if (!sessionId || sessionId === 'undefined' || sessionId === 'null') {
        console.log('⚠️ No session ID available, skipping game completion logging');
        return { success: false, skipped: true };
      }

      const activityData = {
        session_id: sessionId,
        activity_type: 'game_completed',
        word_data: gameData,
        is_correct: true,
        time_spent_seconds: gameData?.totalTime || 0,
        hint_count: gameData?.totalHints || 0,
        user_email: 'guest@wildlitz.com'
      };
      
      return await this.logActivity(activityData);
    } catch (error) {
      console.log('⚠️ Analytics logging skipped:', error.message);
      // Don't throw - fail silently for analytics
      return { success: false };
    }
  }

  /**
   * Get analytics for a specific session
   */
  async getSessionAnalytics(sessionId) {
    try {
      const response = await fetch(`${API_ENDPOINTS.STORY}/session/${sessionId}/analytics/`);
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get session analytics');
      }
      
      return data;
    } catch (error) {
      console.error('Error getting session analytics:', error);
      throw error;
    }
  }

  /**
   * Get analytics for a user
   */
  async getUserAnalytics(userId, days = 30) {
    try {
      const response = await fetch(`${API_ENDPOINTS.STORY}/analytics/?user_id=${userId}&days=${days}`);
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get user analytics');
      }
      
      return data;
    } catch (error) {
      console.error('Error getting user analytics:', error);
      throw error;
    }
  }

  /**
   * Get general analytics (used by dashboard)
   */
  async getAnalytics(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.user_email) params.append('user_email', filters.user_email);
      if (filters.user_id) params.append('user_id', filters.user_id);
      if (filters.days) params.append('days', filters.days);
      if (filters.limit) params.append('limit', filters.limit);
      
      const response = await fetch(`${API_ENDPOINTS.STORY}/analytics/?${params}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch analytics');
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new CrosswordAnalyticsService();