// src/pages/games/crossword/CrosswordAnalyticsDashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from '../../../styles/games/crossword/CrosswordAnalyticsDashboard.module.css';
import crosswordAnalyticsService from '../../../services/crosswordAnalyticsService';

const CrosswordAnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call the analytics service
      const data = await crosswordAnalyticsService.getAnalytics({
        days: 30,
        limit: 50
      });
      
      // Check if we got valid data
      if (data && data.success) {
        setAnalytics(data.analytics);
      } else {
        // No analytics data available yet
        setAnalytics(null);
      }
    } catch (err) {
      // Silently handle errors - just show empty state
      console.log('Analytics not available yet:', err.message);
      setError(null); // Don't show error, just show empty state
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.dashboardContainer}>
        <div className={styles.loadingMessage}>
          <div className={styles.spinner}></div>
          <p>Loading classroom analytics...</p>
        </div>
      </div>
    );
  }

  // Show empty state if no analytics or error
  if (!analytics) {
    return (
      <div className={styles.dashboardContainer}>
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>📊</span>
          <h3>No Data Yet</h3>
          <p>Analytics will appear after students start playing!</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={styles.dashboardContainer}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={styles.dashboardHeader}>
        <h2 className={styles.dashboardTitle}>📊 Classroom Analytics</h2>
        <p className={styles.dashboardSubtitle}>Track student progress at a glance</p>
      </div>

      <div className={styles.statsGrid}>
        {/* Total Games */}
        <motion.div
          className={styles.statCard}
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div className={styles.statIcon}>🎮</div>
          <div className={styles.statContent}>
            <h3 className={styles.statValue}>{analytics.total_games_played || 0}</h3>
            <p className={styles.statLabel}>Games Played</p>
          </div>
        </motion.div>

        {/* Words Attempted */}
        <motion.div
          className={styles.statCard}
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div className={styles.statIcon}>📝</div>
          <div className={styles.statContent}>
            <h3 className={styles.statValue}>{analytics.total_words_attempted || 0}</h3>
            <p className={styles.statLabel}>Words Attempted</p>
          </div>
        </motion.div>

        {/* Accuracy */}
        <motion.div
          className={styles.statCard}
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statContent}>
            <h3 className={styles.statValue}>{analytics.overall_accuracy || 0}%</h3>
            <p className={styles.statLabel}>Overall Accuracy</p>
          </div>
        </motion.div>

        {/* Average Time */}
        <motion.div
          className={styles.statCard}
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div className={styles.statIcon}>⏱️</div>
          <div className={styles.statContent}>
            <h3 className={styles.statValue}>
              {Math.floor((analytics.average_time_per_game || 0) / 60)}m{' '}
              {Math.floor((analytics.average_time_per_game || 0) % 60)}s
            </h3>
            <p className={styles.statLabel}>Avg Time/Game</p>
          </div>
        </motion.div>
      </div>

      {/* Top Words Section */}
      {analytics.top_words && analytics.top_words.length > 0 && (
        <div className={styles.topWordsSection}>
          <h3 className={styles.sectionTitle}>🌟 Most Practiced Words</h3>
          <div className={styles.wordsList}>
            {analytics.top_words.slice(0, 5).map((wordData, index) => (
              <motion.div
                key={index}
                className={styles.wordCard}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className={styles.wordRank}>#{index + 1}</div>
                <div className={styles.wordInfo}>
                  <h4 className={styles.wordText}>{wordData.word}</h4>
                  <div className={styles.wordStats}>
                    <span className={styles.wordAttempts}>
                      {wordData.attempts} attempts
                    </span>
                    <span className={styles.wordAccuracy}>
                      {Math.round(wordData.accuracy)}% correct
                    </span>
                  </div>
                </div>
                <div className={styles.wordProgress}>
                  <div
                    className={styles.wordProgressBar}
                    style={{ width: `${wordData.accuracy}%` }}
                  ></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CrosswordAnalyticsDashboard;