import axios from "axios";
import { API_ENDPOINTS } from "../config/api";

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

      for (const round of sessionData.rounds) {
        if (
          !round.round_number ||
          !round.target_sound ||
          !round.sound_position
        ) {
          console.error("❌ Invalid round data:", round);
          return { success: false, error: "Invalid round data structure" };
        }
      }

      console.log("📊 Saving Sound Safari session to backend...");
      console.log("   - Difficulty:", sessionData.difficulty);
      console.log("   - Total rounds:", sessionData.rounds.length);
      console.log("   - Auth token present:", !!token);
      console.log("   - Endpoint:", `${API_URL}/save-safari-session/`);

      if (token && token.trim() !== "") {
        try {
          const response = await api.post("/save-safari-session/", sessionData);

          console.log("✅ Session saved successfully (authenticated)");
          return {
            success: true,
            ...response.data,
          };
        } catch (authError) {
          console.warn(
            "⚠️ Authenticated save failed, trying anonymous save..."
          );
          console.error(
            "   Error:",
            authError.response?.data || authError.message
          );
        }
      }

      console.log("📊 Attempting anonymous save...");
      const response = await axios.post(
        `${API_URL}/save-safari-session/`,
        sessionData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Session saved successfully (anonymous)");
      return {
        success: true,
        anonymous: true,
        ...response.data,
      };
    } catch (error) {
      console.error("❌ Error saving Sound Safari session:", error);
      console.error("   Status:", error.response?.status);
      console.error("   Response:", error.response?.data);
      console.error("   Message:", error.message);

      return {
        success: false,
        error: error.response?.data?.error || error.message,
        details: error.response?.data,
      };
    }
  },

  async getUserAnalytics() {
    try {
      const token = localStorage.getItem("access_token");

      if (!token || token.trim() === "") {
        console.warn("⚠️ No auth token found");
        return { success: false, error: "Not authenticated" };
      }

      console.log("📊 Fetching ALL user analytics...");

      const response = await api.get(`/get-safari-analytics/`);

      console.log(
        "✅ Analytics fetched successfully:",
        response.data.sessions?.length || 0,
        "sessions"
      );
      return {
        success: true,
        ...response.data,
      };
    } catch (error) {
      console.error("❌ Error fetching Sound Safari analytics:", error);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  },

  async getSessionRounds(sessionId) {
    try {
      const token = localStorage.getItem("access_token");

      if (!token || token.trim() === "") {
        console.warn("⚠️ No auth token found");
        return { success: false, error: "Not authenticated" };
      }

      console.log("🔍 Fetching rounds for session:", sessionId);

      const response = await api.get(`/get-session-rounds/${sessionId}/`);

      console.log("✅ Rounds fetched:", response.data.rounds?.length || 0);
      return {
        success: true,
        ...response.data,
      };
    } catch (error) {
      console.error("❌ Error fetching session rounds:", error);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
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
