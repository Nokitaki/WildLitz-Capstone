// src/services/phonicsAnalyticsService.js
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

export const phonicsAnalyticsService = {
  /**
   * Save complete game session to Supabase
   */
  async saveGameSession(sessionData) {
    try {
      const token = localStorage.getItem('access_token');
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      console.log('Saving game session to Supabase...', sessionData);
      
      const response = await axios.post(
        `${API_URL}/phonics/save-game-session/`,
        sessionData,
        { headers }
      );
      
      console.log('Session saved successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error saving session:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Format session data from game stats
   */
  formatSessionData(gameStats, gameConfig, wordData) {
    const words = wordData.map(w => w.word);
    const wordList = wordData.map(w => ({
      word: w.word,
      pattern: w.pattern,
      definition: w.definition
    }));
    
    const recognized = wordData.map((word, index) => {
      return index < gameStats.wordsRecognized;
    });
    
    const responseTimes = gameStats.responseTimes || 
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
      learningEfficiency: gameStats.learningEfficiency || 0
    };
  },

  /**
   * Get user analytics
   */
  async getUserAnalytics(limit = 10) {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        return null;
      }
      
      const response = await axios.get(
        `${API_URL}/phonics/get-user-analytics/?limit=${limit}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return null;
    }
  },

  /**
   * Get pattern performance
   */
  async getPatternPerformance() {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        return null;
      }
      
      const response = await axios.get(
        `${API_URL}/phonics/get-pattern-performance/`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching pattern performance:', error);
      return null;
    }
  }
};

export default phonicsAnalyticsService;