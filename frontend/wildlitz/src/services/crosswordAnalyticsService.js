// src/services/crosswordAnalyticsService.js
import { API_ENDPOINTS } from '../config/api';
// ✅ RESTORED: Import authService to sync with Profile Page
import { authService } from './authService';

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
      // Return a dummy session so the game doesn't crash
      return { session_id: 'local_' + Date.now() };
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
      if (!response.ok) throw new Error(data.error || 'Failed to update session');
      return data;
    } catch (error) {
      console.error('❌ Error updating session:', error);
      throw error;
    }
  }

  /**
   * Internal Log: Sends detailed stats to Crossword Backend
   */
  async logActivity(activityData) {
    try {
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
      
      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') return { success: false, timeout: true };
      console.error('❌ Error logging activity:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Log when a word is solved
   * ✅ MERGED: Syncs to both Crossword Dashboard AND Profile Page
   */
  async logWordSolved(sessionId, wordData, timeSpent = 0, hintsUsed = 0) {
    // 1. Log to Crossword Backend (Dashboard)
    try {
      if (sessionId && sessionId !== 'undefined' && sessionId !== 'null') {
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
        await this.logActivity(activityData);
      }
    } catch (error) {
      console.log('⚠️ Word logging skipped (Backend):', error.message);
    }

    // 2. ✅ SYNC TO PROFILE PAGE (Auth Service)
    try {
      const token = localStorage.getItem("access_token");
      if (token) {
        const episodeNum = wordData.episodeNumber || 1;
        const episodeLabel = `${episodeNum} Episode`;
        const word = typeof wordData === 'string' ? wordData : wordData.word;

        await authService.logActivity({
          module: 'sentence_formation', 
          activity_type: 'crossword_correct',
          is_correct: true,
          difficulty: episodeLabel, // Formats as "1 Episode" for Profile charts
          time_spent: timeSpent,
          question_data: { word: word, clue: 'Crossword clue' },
          user_answer: { input: word },
          correct_answer: { target: word }
        });
        console.log(`✅ Crossword Correct synced to Profile: ${episodeLabel}`);
      }
    } catch (error) {
      console.error("Error syncing word to profile:", error);
    }
  }

  /**
   * Log answer attempt
   * ✅ MERGED: Syncs to both Crossword Dashboard AND Profile Page (if incorrect)
   */
  async logAnswerAttempt(sessionId, attemptData) {
    // 1. Log to Crossword Backend (Dashboard)
    try {
      if (sessionId && sessionId !== 'undefined' && sessionId !== 'null') {
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
        await this.logActivity(activityData);
      }
    } catch (error) {
      console.log('⚠️ Attempt logging skipped (Backend):', error.message);
    }

    // 2. ✅ SYNC TO PROFILE PAGE (Auth Service)
    // We specifically log incorrect attempts so the profile can calculate accuracy
    try {
      const token = localStorage.getItem("access_token");
      if (token && !attemptData.isCorrect) {
        const episodeNum = attemptData.episodeNumber || 1;
        const episodeLabel = `${episodeNum} Episode`;

        await authService.logActivity({
          module: 'sentence_formation',
          activity_type: 'crossword_incorrect',
          is_correct: false,
          difficulty: episodeLabel,
          time_spent: attemptData.timeSpent || 5,
          question_data: { word: attemptData.word },
          user_answer: { input: attemptData.userAnswer || 'wrong' },
          correct_answer: { target: attemptData.word }
        });
        console.log(`❌ Crossword Incorrect synced to Profile: ${episodeLabel}`);
      }
    } catch (error) {
      console.error("Error syncing attempt to profile:", error);
    }
  }

  /**
   * Log game completion
   * (Mainly for Crossword Dashboard, Profile calculates stats from individual logs)
   */
  async logGameCompleted(sessionId, gameData, solvedWords = [], totalHintsOverride = null) {
    try {
      if (!sessionId || sessionId === 'undefined' || sessionId === 'null') {
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
      
      // Calculate accuracy
      const questionStats = gameData?.questionStats || {};
      const questions = Object.values(questionStats).filter(q => q.finalAttempt);
      
      let accuracyPercentage = 0;
      if (questions.length > 0) {
        const totalScore = questions.reduce((sum, q) => sum + q.score, 0);
        accuracyPercentage = Math.round((totalScore / (questions.length * 100)) * 100 * 10) / 10;
      }
      
      const totalAttempts = Object.values(questionStats).reduce((sum, q) => sum + q.attempts, 0);
      const correctAttempts = questions.length;

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
        question_stats: questionStats
      };

      // Update Session in Crossword DB
      await this.updateSession(sessionId, sessionUpdates);

      // Log Completion Event in Crossword DB
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
      if (!response.ok) throw new Error(data.error || 'Failed to get session analytics');
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
      if (!response.ok) throw new Error(data.error || 'Failed to get analytics');
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
      if (!response.ok) throw new Error(data.error || 'Failed to get analytics');
      return data;
    } catch (error) {
      console.error('Error getting analytics:', error);
      throw error;
    }
  }
}

export default new CrosswordAnalyticsService();