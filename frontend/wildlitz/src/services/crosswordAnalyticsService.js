// src/services/crosswordAnalyticsService.js
// COMPLETE service for crossword game analytics
import { API_ENDPOINTS } from '../config/api';

class CrosswordAnalyticsService {
  /**
   * Helper: Get current user email from localStorage
   */
  getUserEmail() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.email || 'guest@wildlitz.com';
      } catch (e) {
        return 'guest@wildlitz.com';
      }
    }
    return 'guest@wildlitz.com';
  }

  /**
   * Create a new crossword game session
   */
  async createSession(sessionData) {
    try {
      // Use current user email if not provided
      if (!sessionData.user_email) {
        sessionData.user_email = this.getUserEmail();
      }
      
      console.log('📤 Creating session with email:', sessionData.user_email);
      
      const response = await fetch(`${API_ENDPOINTS.SENTENCE_FORMATION}/story/session/create/`, {
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
      
      console.log('✅ Session created:', data.session_id);
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
      console.log('📤 Updating session:', sessionId, updates);
      
      const response = await fetch(`${API_ENDPOINTS.SENTENCE_FORMATION}/story/session/${sessionId}/update/`, {
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
      
      console.log('✅ Session updated:', data);
      return data;
    } catch (error) {
      console.error('❌ Error updating session:', error);
      throw error;
    }
  }

  /**
   * Log a game activity
   */
  async logActivity(activityData) {
    try {
      console.log('📤 Logging activity:', activityData);
      
      const response = await fetch(`${API_ENDPOINTS.SENTENCE_FORMATION}/story/activity/log/`, {
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
      
      console.log('✅ Activity logged:', data);
      return data;
    } catch (error) {
      console.error('❌ Error logging activity:', error);
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
        user_email: this.getUserEmail(),
        episode_number: wordData?.episodeNumber || 1,
        puzzle_id: wordData?.puzzleId || 'unknown'
      };
      
      return await this.logActivity(activityData);
    } catch (error) {
      console.log('⚠️ Word logging skipped:', error.message);
      return { success: false };
    }
  }

  /**
   * Log when a game is completed (used by SummaryScreen)
   */
  async logGameCompleted(sessionId, gameData, solvedWords = []) {
  try {
    // Skip logging if no valid session ID
    if (!sessionId || sessionId === 'undefined' || sessionId === 'null') {
      console.log('⚠️ No session ID available, skipping game completion logging');
      return { success: false, skipped: true };
    }

    console.log('📤 Logging game completion for session:', sessionId);

    // Extract vocabulary words from solvedWords array
    const vocabularyWords = solvedWords.map(sw => sw.word || sw);

    // Update the session with completion data INCLUDING vocabulary words
    const sessionUpdates = {
      total_words_solved: gameData?.wordsLearned || 0,
      total_duration_seconds: gameData?.totalTime || 0,
      total_hints_used: gameData?.totalHints || 0,
      episodes_completed: gameData?.episodesCompleted || 1,
      completion_percentage: gameData?.accuracy || 0,
      is_completed: gameData?.isFullyCompleted || false,
      vocabulary_words_learned: vocabularyWords  // NEW: Add vocabulary words
    };

    await this.updateSession(sessionId, sessionUpdates);

    // Also log as an activity
    const activityData = {
      session_id: sessionId,
      activity_type: 'game_completed',
      word_data: {
        ...gameData,
        vocabulary_words: vocabularyWords  // Include in activity log too
      },
      is_correct: true,
      time_spent_seconds: gameData?.totalTime || 0,
      hint_count: gameData?.totalHints || 0,
      user_email: this.getUserEmail()
    };
    
    await this.logActivity(activityData);
    
    console.log('✅ Game completion logged successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Game completion logging failed:', error);
    console.log('⚠️ Analytics logging skipped:', error.message);
    return { success: false, error: error.message };
  }
}

  /**
   * Get analytics for a specific session
   */
  async getSessionAnalytics(sessionId) {
    try {
      const response = await fetch(`${API_ENDPOINTS.SENTENCE_FORMATION}/story/session/${sessionId}/`);
      
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
  async getUserAnalytics(userEmail = null, days = 30) {
    try {
      const email = userEmail || this.getUserEmail();
      const response = await fetch(
        `${API_ENDPOINTS.SENTENCE_FORMATION}/story/analytics/?user_email=${email}&days=${days}`
      );
      
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
      
      // Use current user email if not specified
      const userEmail = filters.user_email || this.getUserEmail();
      params.append('user_email', userEmail);
      
      if (filters.user_id) params.append('user_id', filters.user_id);
      if (filters.days) params.append('days', filters.days);
      if (filters.limit) params.append('limit', filters.limit);
      
      const response = await fetch(`${API_ENDPOINTS.SENTENCE_FORMATION}/story/analytics/?${params}`);
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