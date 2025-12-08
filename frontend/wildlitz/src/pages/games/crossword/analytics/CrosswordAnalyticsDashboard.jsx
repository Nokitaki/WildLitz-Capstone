
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import crosswordAnalyticsService from '../../../../services/crosswordAnalyticsService';
import { API_ENDPOINTS } from '../../../../config/api';


import StatsCards from './StatsCards';
import ChallengingWordsSection from './ChallengingWordsSection';
import GameSessionsList from './GameSessionsList';


import styles from '../../../../styles/games/crossword/analytics/CrosswordAnalyticsDashboard.module.css';

const CrosswordAnalyticsDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [analytics, setAnalytics] = useState(null);
  const [gameSessions, setGameSessions] = useState([]);
  const [wordPerformance, setWordPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const userEmail = user?.email || 'guest@wildlitz.com';
        
       
        const analyticsData = await crosswordAnalyticsService.getAnalytics({
          user_email: userEmail,
          days: 365
        });
        
       if (analyticsData.success) {
  console.log('📊 Raw analytics data:', analyticsData.analytics);
  console.log('   Average accuracy:', analyticsData.analytics.summary?.average_accuracy);
  setAnalytics(analyticsData.analytics.summary);
  setGameSessions(analyticsData.analytics.recent_sessions || []);
}

       
        const wordResponse = await fetch(
          `${API_ENDPOINTS.SENTENCE_FORMATION}/story/word-performance/?user_email=${userEmail}`
        );
        const wordData = await wordResponse.json();
        
        if (wordData.success) {
          setWordPerformance(wordData.words || []);
        }
      } catch (err) {
        console.error('Analytics fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.email]);

  if (loading) {
    return (
      <div className={styles.dashboardContainer}>
        <div className={styles.loadingMessage}>
          <div className={styles.spinner}></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      {/* Back Button */}
      <div className={styles.backButtonContainer}>
        <motion.button
          onClick={() => navigate('/home')}
          className={styles.backButton}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className={styles.backArrow}>←</span>
          <span>Back to Games</span>
        </motion.button>
      </div>

      {/* Header */}
      <div className={styles.dashboardHeader}>
        <h2 className={styles.dashboardTitle}>📊 Classroom Analytics</h2>
        <p className={styles.dashboardSubtitle}>Track student progress at a glance</p>
      </div>

    
      <StatsCards analytics={analytics} />

      
      <ChallengingWordsSection wordPerformance={wordPerformance} />

     
      <GameSessionsList gameSessions={gameSessions} />
    </div>
  );
};

export default CrosswordAnalyticsDashboard;