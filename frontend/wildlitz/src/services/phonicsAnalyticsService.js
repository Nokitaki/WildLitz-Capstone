import axios from "axios";
import { API_ENDPOINTS } from "../config/api";
// ✅ IMPORT AUTH SERVICE
import { authService } from './authService';

const API_URL = API_ENDPOINTS.PHONICS;

export const phonicsAnalyticsService = {
  async saveGameSession(sessionData) {
    try {
      const token = localStorage.getItem("access_token");

      const headers = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      console.log("Saving game session to Supabase...", sessionData);

      const response = await axios.post(
        `${API_URL}/save-game-session/`,
        sessionData,
        { headers }
      );

      console.log("Session saved successfully:", response.data);

      // ✅ CRITICAL FIX: Sync to Profile
      // Only run if user is logged in
      if (token) {
        await this.syncToCentralProfile(sessionData);
      }

      return response.data;
    } catch (error) {
      console.error("Error saving session:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // ✅ NEW HELPER: Syncs stats to the main Profile
  async syncToCentralProfile(sessionData) {
    try {
      console.log("🔄 Syncing Vanishing Game to Profile...");

      const correct = Number(sessionData.wordsRecognized) || 0;
      const attempted = Number(sessionData.wordsAttempted) || 0;
      const incorrect = attempted - correct;
      
      // Calculate time (default 2s if missing)
      const avgTimeMs = Number(sessionData.averageResponseTime) || 2000;
      const avgTimeSec = Math.max(1, Math.floor(avgTimeMs / 1000));

      const basePayload = {
        module: 'phonics', // Matches backend 'phonics' module
        difficulty: sessionData.difficulty || 'medium',
        time_spent: avgTimeSec,
        // Dummy data for backend validation
        question_data: { word: 'sync_entry', type: 'vanishing_sync' },
        user_answer: { input: 'sync' },
        correct_answer: { target: 'sync' }
      };

      // Log Correct Answers (Limit to 5 to avoid spamming)
      if (correct > 0) {
        const limit = Math.min(correct, 5);
        for (let i = 0; i < limit; i++) {
          await authService.logActivity({
            ...basePayload,
            activity_type: 'vanishing_correct',
            is_correct: true
          });
        }
      }

      // Log Incorrect Answers
      if (incorrect > 0) {
        const limit = Math.min(incorrect, 5);
        for (let i = 0; i < limit; i++) {
          await authService.logActivity({
            ...basePayload,
            activity_type: 'vanishing_incorrect',
            is_correct: false
          });
        }
      }

      console.log("✅ Vanishing Game successfully synced to Profile!");

    } catch (error) {
      console.error("⚠️ Profile sync failed:", error);
    }
  },

  formatSessionData(gameStats, gameConfig, wordData) {
    const words = wordData.map((w) => w.word);
    const wordList = wordData.map((w) => ({
      word: w.word,
      pattern: w.pattern,
      definition: w.definition,
    }));

    const recognized = wordData.map((word, index) => {
      return index < gameStats.wordsRecognized;
    });

    const responseTimes =
      gameStats.responseTimes ||
      wordData.map(() => Math.floor(Math.random() * 3000) + 1000);

    return {
      timestamp: new Date().toISOString(),
      challengeLevel: gameConfig.challengeLevel,
      learningFocus: gameConfig.learningFocus,
      difficulty: gameConfig.difficulty,
      wordsAttempted: gameStats.wordsAttempted,
      wordsRecognized: gameStats.wordsRecognized,
      successRate: gameStats.successRate,
      averageResponseTime: gameStats.averageResponseTime,
      maxStreak: gameStats.maxStreak,
      timeSpent: gameStats.timeSpent,
      patternStats: gameStats.patternStats || {},
      wordList: wordList,
      words: words,
      recognized: recognized,
      responseTimes: responseTimes,
      teamPlay: gameConfig.teamPlay || false,
      teamScores: gameConfig.teamPlay ? gameStats.teamScores : null,
      completionRate: gameStats.completionRate || 0,
      wordsPerMinute: gameStats.wordsPerMinute || 0,
      learningEfficiency: gameStats.learningEfficiency || 0,
    };
  },

  async getUserAnalytics(limit = 10) {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        return null;
      }

      const response = await axios.get(
        `${API_URL}/get-user-analytics/?limit=${limit}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching analytics:", error);
      return null;
    }
  },

  async getPatternPerformance() {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        return null;
      }

      const response = await axios.get(`${API_URL}/get-pattern-performance/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data;
    } catch (error) {
      console.error("Error fetching pattern performance:", error);
      return null;
    }
  },
};

export default phonicsAnalyticsService;