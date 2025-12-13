// crosswordAnalyticsService.js - COMPLETE WITH ALL FIXES
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
   * ✅ MODIFIED: Added accuracy tracking fields
   */
  async createSession(sessionData) {
    try {
      if (!sessionData.user_email) {
        sessionData.user_email = this.getUserEmail();
      }
      
      // ✅ ADD ACCURACY FIELDS IF NOT PROVIDED
      if (!sessionData.total_attempts) sessionData.total_attempts = 0;
      if (!sessionData.correct_attempts) sessionData.correct_attempts = 0;
      if (!sessionData.accuracy_percentage) sessionData.accuracy_percentage = 0;
      
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

 // In crosswordAnalyticsService.js - Fix logActivity method
async logActivity(activityData) {
  try {
    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(`${API_ENDPOINTS.SENTENCE_FORMATION}/story/activity/log/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(activityData),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server error:', response.status, errorText);
      return { success: false, error: `HTTP ${response.status}` };
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('⚠️ Request timeout - analytics may not be saved');
      return { success: false, timeout: true };
    }
    console.error('❌ Error logging activity:', error);
    return { success: false, error: error.message };
  }
}

async logGameCompleted(sessionData) {
  try {
    await this.logActivity({
      ...sessionData,
      activity_type: 'game_completed'
    });
  } catch (error) {
    // Don't throw - just log
    console.warn('⚠️ Game completion logging failed, continuing anyway');
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
   * ✅ NEW: Log an answer attempt (correct or wrong)
   */
  async logAnswerAttempt(sessionId, attemptData) {
    try {
      if (!sessionId || sessionId === 'undefined' || sessionId === 'null') {
        console.log('⚠️ No session ID available, skipping attempt logging');
        return { success: false, skipped: true };
      }

      const activityData = {
        session_id: sessionId,
        activity_type: 'answer_attempt',
        word_data: {
          word: attemptData.word,
          timeSpent: attemptData.timeSpent,
          hintsUsed: attemptData.hintsUsed
        },
        is_correct: attemptData.isCorrect,
        time_spent_seconds: attemptData.timeSpent,
        hint_count: attemptData.hintsUsed || 0,
        user_email: this.getUserEmail(),
        episode_number: attemptData.episodeNumber || 1
      };
      
      return await this.logActivity(activityData);
    } catch (error) {
      console.log('⚠️ Attempt logging skipped:', error.message);
      return { success: false };
    }
  }

  /**
   * Log game completion with proper episode-based completion percentage
   * ✅ MODIFIED: Added accuracy tracking
   */
  async logGameCompleted(sessionId, gameData, solvedWords = [], totalHintsOverride = null) {
  try {
    if (!sessionId || sessionId === 'undefined' || sessionId === 'null') {
      console.log('⚠️ No session ID available, skipping game completion logging');
      return { success: false, skipped: true };
    }

    const vocabularyWords = Array.from(
      solvedWords.map(sw => {
        if (typeof sw === 'string') return sw;
        if (sw && sw.word) return sw.word;
        return null;
      }).filter(Boolean)
    );

    const hintsUsed = totalHintsOverride !== null 
      ? totalHintsOverride 
      : (gameData?.totalHints || gameData?.total_hints_used || 0);
    
    // ✅ NEW: Calculate accuracy from questionStats
    const questionStats = gameData?.questionStats || {};
    const questions = Object.values(questionStats).filter(q => q.finalAttempt);
    
    let accuracyPercentage = 0;
    if (questions.length > 0) {
      const totalScore = questions.reduce((sum, q) => sum + q.score, 0);
      accuracyPercentage = Math.round((totalScore / (questions.length * 100)) * 100 * 10) / 10;
    }
    
    const totalAttempts = Object.values(questionStats).reduce((sum, q) => sum + q.attempts, 0);
    const correctAttempts = questions.length;
    
    console.log('📊 Logging game completion:');
    console.log('  - Session ID:', sessionId);
    console.log('  - Total Hints:', hintsUsed);
    console.log('  - Words solved:', solvedWords.length);
    console.log('  - Total Attempts:', totalAttempts);
    console.log('  - Correct Attempts:', correctAttempts);
    console.log('  - Accuracy:', accuracyPercentage + '%');

    const sessionUpdates = {
      total_words_solved: gameData?.wordsLearned || solvedWords.length || 0,
      total_duration_seconds: gameData?.totalTime || 0,
      total_hints_used: hintsUsed,
      episodes_completed: gameData?.episodesCompleted || 1,
      completion_percentage: gameData?.completionPercentage || 0,
      is_completed: gameData?.isFullyCompleted || false,
      vocabulary_words_learned: vocabularyWords,
      total_attempts: totalAttempts,
      correct_attempts: correctAttempts,
      accuracy_percentage: accuracyPercentage,
      question_stats: questionStats // ✅ Store full question stats
    };

    await this.updateSession(sessionId, sessionUpdates);

    const activityData = {
      session_id: sessionId,
      activity_type: 'game_completed',
      word_data: {
        wordsLearned: gameData?.wordsLearned || solvedWords.length || 0,
        totalTime: gameData?.totalTime || 0,
        totalHints: hintsUsed,
        episodesCompleted: gameData?.episodesCompleted || 1,
        accuracy: gameData?.accuracy || 0,
        completionPercentage: gameData?.completionPercentage || 0,
        vocabulary_words: vocabularyWords.slice(),
        totalAttempts: totalAttempts,
        correctAttempts: correctAttempts,
        accuracyPercentage: accuracyPercentage,
        questionStats: questionStats
      },
      is_correct: true,
      time_spent_seconds: gameData?.totalTime || 0,
      hint_count: hintsUsed,
      user_email: this.getUserEmail()
    };
    
    await this.logActivity(activityData);
    
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