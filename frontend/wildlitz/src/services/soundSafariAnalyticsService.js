//src/services/soundSafariAnalyticsService.js
import axios from "axios";
import { API_ENDPOINTS } from "../config/api";
// ✅ IMPORT AUTH SERVICE TO LINK TO PROFILE
import { authService } from "./authService";

const API_URL = API_ENDPOINTS.PHONEMICS;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token && token.trim() !== "") {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken && refreshToken.trim() !== "") {
        try {
          console.log("🔄 Attempting to refresh expired token...");

          const refreshResponse = await axios.post(
            `${API_URL.replace("/phonemics", "")}/auth/refresh/`,
            { refresh: refreshToken }
          );

          const newAccessToken = refreshResponse.data.access;
          localStorage.setItem("access_token", newAccessToken);

          console.log("✅ Token refreshed successfully");

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          console.error("❌ Token refresh failed:", refreshError);

          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
      }
    }

    return Promise.reject(error);
  }
);

export const soundSafariAnalyticsService = {
  async saveGameSession(sessionData) {
    try {
      const token = localStorage.getItem("access_token");

      if (!sessionData.difficulty) {
        console.error("❌ Missing difficulty in session data");
        return { success: false, error: "Missing difficulty" };
      }

      if (!sessionData.rounds || sessionData.rounds.length === 0) {
        console.error("❌ Missing or empty rounds array");
        return { success: false, error: "Missing rounds data" };
      }

      // Validate rounds
      for (const round of sessionData.rounds) {
        if (!round.round_number || !round.target_sound || !round.sound_position) {
          console.error("❌ Invalid round data:", round);
          return { success: false, error: "Invalid round data structure" };
        }
      }

      console.log("📊 Saving Sound Safari session...");
      let responseData;

      // 1. ORIGINAL LOGIC: Save to Sound Safari Database
      if (token && token.trim() !== "") {
        try {
          const response = await api.post("/save-safari-session/", sessionData);
          console.log("✅ Session saved successfully (authenticated)");
          responseData = { success: true, ...response.data };
        } catch (authError) {
          console.warn("⚠️ Authenticated save failed, trying anonymous save...");
          const response = await axios.post(
            `${API_URL}/save-safari-session/`,
            sessionData,
            { headers: { "Content-Type": "application/json" } }
          );
          responseData = { success: true, anonymous: true, ...response.data };
        }
      } else {
        const response = await axios.post(
          `${API_URL}/save-safari-session/`,
          sessionData,
          { headers: { "Content-Type": "application/json" } }
        );
        responseData = { success: true, anonymous: true, ...response.data };
      }

      // ✅ 2. NEW LOGIC: Sync to Main Profile
      // Only runs if the user is logged in
      if (token && token.trim() !== "") {
        this.syncToCentralProfile(sessionData);
      }

      return responseData;

    } catch (error) {
      console.error("❌ Error saving Sound Safari session:", error);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        details: error.response?.data,
      };
    }
  },

  // ✅ HELPER FUNCTION: Sends data to the main User Profile
  async syncToCentralProfile(sessionData) {
    try {
      console.log("🔄 Syncing Sound Safari data to Profile...");
      
      // Calculate totals
      let totalCorrect = 0;
      let totalIncorrect = 0;
      let totalTime = sessionData.time_spent || 0;

      sessionData.rounds.forEach(round => {
        totalCorrect += (round.correct || 0);
        totalIncorrect += (round.incorrect || 0);
      });

      const totalAttempts = totalCorrect + totalIncorrect;
      if (totalAttempts === 0) return;

      const logPromises = [];

      // 🔥 FIX: Added 'question_data', 'user_answer', 'correct_answer' 
      // These are REQUIRED by your Django UserActivity model
      
      const basePayload = {
        module: 'phonemics', // Matches backend/models.py
        difficulty: sessionData.difficulty,
        time_spent: Math.max(1, Math.floor(totalTime / totalAttempts)),
        // Dummy data to satisfy backend requirements
        question_data: { type: 'safari_sync', sound: 'various' },
        user_answer: { selection: 'sync_entry' },
        correct_answer: { target: 'sync_entry' }
      };

      // Log Correct Answers (Limit to 10 to prevent network spam)
      const correctToLog = Math.min(totalCorrect, 10);
      for (let i = 0; i < correctToLog; i++) {
        logPromises.push(authService.logActivity({
          ...basePayload,
          activity_type: 'sound_safari_correct',
          is_correct: true,
        }));
      }

      // Log Incorrect Answers
      const incorrectToLog = Math.min(totalIncorrect, 10);
      for (let i = 0; i < incorrectToLog; i++) {
        logPromises.push(authService.logActivity({
          ...basePayload,
          activity_type: 'sound_safari_incorrect',
          is_correct: false,
        }));
      }

      if (logPromises.length > 0) {
        await Promise.all(logPromises);
        console.log("✅ Sound Safari successfully synced to Profile!");
      }

    } catch (err) {
      // We log this as a warning so it doesn't crash the game
      console.warn("⚠️ Failed to sync to profile (Local save was successful):", err.message);
    }
  },

  async getUserAnalytics() {
    try {
      const token = localStorage.getItem("access_token");

      if (!token || token.trim() === "") {
        console.warn("⚠️ No auth token found");
        return { success: false, error: "Not authenticated" };
      }

      const response = await api.get(`/get-safari-analytics/`);
      return { success: true, ...response.data };
    } catch (error) {
      console.error("❌ Error fetching Sound Safari analytics:", error);
      return { success: false, error: error.message };
    }
  },

  async getSessionRounds(sessionId) {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return { success: false, error: "Not authenticated" };

      const response = await api.get(`/get-session-rounds/${sessionId}/`);
      return { success: true, ...response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  formatRoundData(roundNumber, gameConfig, roundResults) {
    const correctCount = roundResults.correctSelections || 0;
    const actualIncorrect = roundResults.incorrectSelections || 0;
    const missedCount = roundResults.missedCorrect || 0;
    const totalIncorrect = actualIncorrect + missedCount;
    const totalCount = correctCount + totalIncorrect;

    return {
      round_number: roundNumber,
      target_sound: gameConfig.targetSound,
      sound_position: gameConfig.soundPosition,
      environment: gameConfig.environment,
      correct: correctCount,
      incorrect: totalIncorrect,
      total: totalCount,
      correctCount: correctCount,
      totalCorrectAnimals: totalCount,
      time_spent: roundResults.timeSpent || 0,
    };
  },

  formatSessionData(gameConfig, allRounds, totalTimeSpent) {
    return {
      played_at: new Date().toISOString(),
      difficulty: gameConfig.difficulty,
      time_spent: Math.floor(totalTimeSpent / 1000),
      completed: true,
      rounds: allRounds,
    };
  },
};

export default soundSafariAnalyticsService;