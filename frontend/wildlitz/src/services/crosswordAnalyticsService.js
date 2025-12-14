// src/services/crosswordAnalyticsService.js
import axios from "axios";
import { API_ENDPOINTS } from "../config/api";
// ✅ IMPORT AUTH SERVICE
import { authService } from './authService';

const API_URL = API_ENDPOINTS.SENTENCE_FORMATION; 

export const crosswordAnalyticsService = {
  
  // Helper: Get user email
  getUserEmail() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr).email || 'guest@wildlitz.com';
      } catch (e) {
        return 'guest@wildlitz.com';
      }
    }
    return 'guest@wildlitz.com';
  },

  // 1. Create Session
  async createSession(sessionData) {
    try {
      const token = localStorage.getItem("access_token");
      
      // If no token, return a local dummy session
      if (!token) {
        return { session_id: 'guest_' + Date.now() };
      }

      if (!sessionData.user_email) {
        sessionData.user_email = this.getUserEmail();
      }

      const response = await axios.post(
        `${API_URL}/create-session/`,
        sessionData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return response.data;
    } catch (error) {
      console.error("Error creating crossword session:", error);
      // Fallback to local session
      return { session_id: 'local_' + Date.now() };
    }
  },

  // 2. Log Word Solved (CORRECT ANSWER)
  async logWordSolved(sessionId, wordData, timeSpent, hintsUsed) {
    try {
      const token = localStorage.getItem("access_token");
      
      // A. Save to Crossword DB
      if (token && !sessionId.toString().startsWith('local') && !sessionId.toString().startsWith('guest')) {
        await axios.post(
          `${API_URL}/log-word/`,
          {
            session_id: sessionId,
            word: wordData.word,
            time_spent: timeSpent,
            hints_used: hintsUsed,
            is_correct: true
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // B. ✅ SYNC TO PROFILE
      if (token) {
        const episodeNum = wordData.episodeNumber || 1;
        // 🔥 KEY CHANGE: "1 Episode" format
        const episodeLabel = `${episodeNum} Episode`; 
        const word = typeof wordData === 'string' ? wordData : wordData.word;

        await authService.logActivity({
          module: 'sentence_formation', 
          activity_type: 'crossword_correct',
          is_correct: true,
          difficulty: episodeLabel, // <--- "1 Episode"
          time_spent: timeSpent,
          question_data: { word: word, clue: 'Crossword clue' },
          user_answer: { input: word },
          correct_answer: { target: word }
        });
        console.log(`✅ Crossword Correct synced: ${episodeLabel}`);
      }

    } catch (error) {
      console.error("Error logging solved word:", error);
    }
  },

  // 3. Log Attempt (INCORRECT ANSWER)
  async logAnswerAttempt(sessionId, attemptData) {
    try {
      const token = localStorage.getItem("access_token");
      
      if (token) {
        const episodeNum = attemptData.episodeNumber || 1;
        // 🔥 KEY CHANGE: "1 Episode" format
        const episodeLabel = `${episodeNum} Episode`;

        await authService.logActivity({
          module: 'sentence_formation',
          activity_type: 'crossword_incorrect',
          is_correct: false,
          difficulty: episodeLabel, // <--- "1 Episode"
          time_spent: attemptData.timeSpent || 5,
          question_data: { word: attemptData.word },
          user_answer: { input: attemptData.userAnswer || 'wrong' },
          correct_answer: { target: attemptData.word }
        });
        console.log(`❌ Crossword Incorrect synced: ${episodeLabel}`);
      }
    } catch (error) {
      console.error("Error logging attempt:", error);
    }
  },

  // 4. Log Game Completed
  async logGameCompleted(sessionId, stats) {
    try {
      const token = localStorage.getItem("access_token");
      
      if (token && !sessionId.toString().startsWith('local') && !sessionId.toString().startsWith('guest')) {
        await axios.post(
          `${API_URL}/complete-session/`,
          { session_id: sessionId, ...stats },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("🏆 Crossword Session Completed & Saved");
      }
    } catch (error) {
      console.error("Error completing session:", error);
    }
  },

  // --- DASHBOARD METHODS ---
  async getSessionAnalytics(sessionId) {
    try {
      const response = await axios.get(`${API_URL}/session/${sessionId}/`);
      return response.data;
    } catch (error) {
      console.error('Error getting session analytics:', error);
      throw error;
    }
  },

  async getUserAnalytics(userEmail = null, days = 30) {
    try {
      const email = userEmail || this.getUserEmail();
      const response = await axios.get(
        `${API_URL}/analytics/?user_email=${email}&days=${days}`
      );
      return response.data;
    } catch (error) {
      console.error('Error getting user analytics:', error);
      return { success: false };
    }
  },

  async getAnalytics(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await axios.get(`${API_URL}/analytics/?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error getting analytics:', error);
      return { success: false };
    }
  }
};

export default crosswordAnalyticsService;