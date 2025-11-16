// crosswordAnalyticsService.js - FIXED VERSION with episode-based completion percentage
// Place this at: frontend/wildlitz/src/services/crosswordAnalyticsService.js

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
   * Log game completion with proper episode-based completion percentage
   */
  async logGameCompleted(sessionId, gameData, solvedWords = [], totalHintsOverride = null) {
    try {
      if (!sessionId || sessionId === 'undefined' || sessionId === 'null') {
        console.log('⚠️ No session ID available, skipping game completion logging');
        return { success: false, skipped: true };
      }

      // Extract vocabulary words from solvedWords array
      const vocabularyWords = Array.from(
        solvedWords.map(sw => {
          if (typeof sw === 'string') return sw;
          if (sw && sw.word) return sw.word;
          return null;
        }).filter(Boolean)
      );

      // ✅ FIX: Properly extract hints with multiple fallbacks
      const hintsUsed = totalHintsOverride !== null 
        ? totalHintsOverride 
        : (gameData?.totalHints || gameData?.total_hints_used || 0);
      
      console.log('📊 Logging game completion:');
      console.log('  - Session ID:', sessionId);
      console.log('  - Total Hints:', hintsUsed);
      console.log('  - Words solved:', solvedWords.length);
      console.log('  - Episodes completed:', gameData?.episodesCompleted);
      console.log('  - Word Accuracy:', gameData?.accuracy + '%');
      console.log('  - Completion Percentage (episodes):', gameData?.completionPercentage + '%');

      // ✅ FIX: Use episode-based completion percentage, NOT word accuracy
      const sessionUpdates = {
        total_words_solved: gameData?.wordsLearned || solvedWords.length || 0,
        total_duration_seconds: gameData?.totalTime || 0,
        total_hints_used: hintsUsed,
        episodes_completed: gameData?.episodesCompleted || 1,
        completion_percentage: gameData?.completionPercentage || 0,  // ✅ FIXED: Use episode-based completion
        is_completed: gameData?.isFullyCompleted || false,
        vocabulary_words_learned: vocabularyWords
      };

      console.log('📊 Session updates being sent:', JSON.stringify(sessionUpdates, null, 2));

      await this.updateSession(sessionId, sessionUpdates);

      // Also log as an activity
      const activityData = {
        session_id: sessionId,
        activity_type: 'game_completed',
        word_data: {
          wordsLearned: gameData?.wordsLearned || solvedWords.length || 0,
          totalTime: gameData?.totalTime || 0,
          totalHints: hintsUsed,
          episodesCompleted: gameData?.episodesCompleted || 1,
          accuracy: gameData?.accuracy || 0,  // Word accuracy (for this episode)
          completionPercentage: gameData?.completionPercentage || 0,  // Overall completion (episodes)
          vocabulary_words: vocabularyWords.slice()
        },
        is_correct: true,
        time_spent_seconds: gameData?.totalTime || 0,
        hint_count: hintsUsed,
        user_email: this.getUserEmail()
      };
      
      console.log('📊 Activity data being sent:', JSON.stringify(activityData, null, 2));
      
      await this.logActivity(activityData);
      
      console.log('✅ Game completion logged successfully');
      console.log('  - Word Accuracy (episode):', gameData?.accuracy + '%');
      console.log('  - Overall Completion (story):', gameData?.completionPercentage + '%');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Game completion logging failed:', error);
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
        throw new Error(data.error || 'Failed to get analytics');
      }
      
      return data;
    } catch (error) {
      console.error('Error getting user analytics:', error);
      throw error;
    }
  }

  /**
   * Get general analytics (supports query params)
   */
  async getAnalytics(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await fetch(
        `${API_ENDPOINTS.SENTENCE_FORMATION}/story/analytics/?${queryParams}`
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get analytics');
      }
      
      return data;
    } catch (error) {
      console.error('Error getting analytics:', error);
      throw error;
    }
  }
}

export default new CrosswordAnalyticsService();