// frontend/wildlitz/src/pages/games/soundsafari/SoundSafariAnalytics.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import styles from '../../../styles/games/safari/SoundSafariAnalytics.module.css';
import soundSafariAnalyticsService from '../../../services/soundSafariAnalyticsService';

const SoundSafariAnalytics = () => {
  const [sessions, setSessions] = useState([]);
  const [soundPerformance, setSoundPerformance] = useState([]);
  const [aggregateStats, setAggregateStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      const analyticsData = await soundSafariAnalyticsService.getUserAnalytics(20);
      
      if (analyticsData && analyticsData.success) {
        setSessions(analyticsData.sessions || []);
        setSoundPerformance(analyticsData.sound_performance || []);
        setAggregateStats(analyticsData.aggregate_stats || null);
      }
      
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format session data for charts
  const sessionChartData = useMemo(() => {
    if (!sessions || sessions.length === 0) return [];
    
    return sessions
      .slice(0, 10)
      .reverse()
      .map((session, index) => ({
        session: `#${index + 1}`,
        successRate: session.success_rate || 0,
        correctSelections: session.correct_selections || 0,
        timeSpent: session.time_spent || 0,
        date: new Date(session.timestamp).toLocaleDateString()
      }));
  }, [sessions]);

  // Format sound performance data
  const soundPerformanceData = useMemo(() => {
    if (!soundPerformance || soundPerformance.length === 0) return [];
    
    return soundPerformance.map(sound => ({
      name: sound.sound.toUpperCase(),
      'Success Rate': sound.success_rate || 0,
      attempts: sound.attempts || 0,
      correct: sound.total_correct || 0
    }));
  }, [soundPerformance]);

  // Color scale for success rates
  const getSuccessColor = (rate) => {
    if (rate >= 80) return '#4CAF50';
    if (rate >= 60) return '#FFC107';
    return '#F44336';
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}>🦁</div>
        <p>Loading your Sound Safari progress...</p>
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>🦁</div>
        <h3>No Sound Safari Data Yet</h3>
        <p>Play some Sound Safari games to see your phonemic awareness progress!</p>
      </div>
    );
  }

  return (
    <div className={styles.analyticsContainer}>
      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2>🦁 Sound Safari Progress</h2>
        <button onClick={loadAnalytics} className={styles.refreshButton}>
          🔄 Refresh
        </button>
      </motion.div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <motion.div
          className={styles.summaryCard}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className={styles.cardIcon}>🎮</div>
          <div className={styles.cardContent}>
            <h3>Total Games</h3>
            <p className={styles.statValue}>{aggregateStats?.total_sessions || 0}</p>
          </div>
        </motion.div>

        <motion.div
          className={styles.summaryCard}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className={styles.cardIcon}>🎯</div>
          <div className={styles.cardContent}>
            <h3>Success Rate</h3>
            <p className={styles.statValue} style={{ color: getSuccessColor(aggregateStats?.average_success_rate || 0) }}>
              {aggregateStats?.average_success_rate?.toFixed(1) || 0}%
            </p>
          </div>
        </motion.div>

        <motion.div
          className={styles.summaryCard}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className={styles.cardIcon}>🦁</div>
          <div className={styles.cardContent}>
            <h3>Animals Found</h3>
            <p className={styles.statValue}>{aggregateStats?.total_correct || 0}</p>
          </div>
        </motion.div>

        <motion.div
          className={styles.summaryCard}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className={styles.cardIcon}>⏱️</div>
          <div className={styles.cardContent}>
            <h3>Avg Time</h3>
            <p className={styles.statValue}>{aggregateStats?.average_time_per_game?.toFixed(0) || 0}s</p>
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className={styles.chartsGrid}>
        {/* Success Rate Over Time */}
        <motion.div
          className={styles.chartCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3>📈 Success Rate Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={sessionChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis dataKey="session" stroke="#fff" />
              <YAxis stroke="#fff" domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#5D4037', 
                  border: '2px solid #FFD700',
                  borderRadius: '10px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="successRate" 
                stroke="#FFD700" 
                strokeWidth={3}
                name="Success Rate (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Sound Performance */}
        <motion.div
          className={styles.chartCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3>🔊 Performance by Sound</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={soundPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis dataKey="name" stroke="#fff" />
              <YAxis stroke="#fff" domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#5D4037', 
                  border: '2px solid #FFD700',
                  borderRadius: '10px'
                }}
              />
              <Legend />
              <Bar dataKey="Success Rate" fill="#4ECDC4" name="Success Rate (%)" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent Sessions Table */}
      <motion.div
        className={styles.tableCard}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <h3>📋 Recent Game Sessions</h3>
        <div className={styles.tableWrapper}>
          <table className={styles.sessionsTable}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Sound</th>
                <th>Position</th>
                <th>Difficulty</th>
                <th>Success Rate</th>
                <th>Animals Found</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {sessions.slice(0, 10).map((session, index) => (
                <tr key={index}>
                  <td>{new Date(session.timestamp).toLocaleDateString()}</td>
                  <td className={styles.soundCell}>{session.target_sound?.toUpperCase()}</td>
                  <td>{session.sound_position}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[session.difficulty]}`}>
                      {session.difficulty}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: getSuccessColor(session.success_rate) }}>
                      {session.success_rate?.toFixed(1)}%
                    </span>
                  </td>
                  <td>{session.correct_selections}/{session.animals_shown}</td>
                  <td>{session.time_spent}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default SoundSafariAnalytics;