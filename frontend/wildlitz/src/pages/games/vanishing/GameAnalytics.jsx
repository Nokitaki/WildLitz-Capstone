// src/pages/games/vanishing/GameAnalytics.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import styles from '../../../styles/games/vanishing/GameAnalytics.module.css';
import phonicsAnalyticsService from '../../../services/phonicsAnalyticsService';

const GameAnalytics = () => {
  const [sessions, setSessions] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('successRate');

   const formatPatternName = (pattern) => {
    if (!pattern) return 'Unknown';
    return pattern
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Load user analytics (includes sessions)
      const analyticsData = await phonicsAnalyticsService.getUserAnalytics(20);
      if (analyticsData && analyticsData.success) {
        setSessions(analyticsData.sessions || []);
      }
      
      // Load pattern performance
      const patternData = await phonicsAnalyticsService.getPatternPerformance();
      if (patternData && patternData.success) {
        setPatterns(patternData.patterns || []);
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
        wordsRecognized: session.words_recognized || 0,
        responseTime: session.average_response_time || 0,
        maxStreak: session.max_streak || 0,
        date: new Date(session.timestamp).toLocaleDateString()
      }));
  }, [sessions]);

  // Format pattern performance data
  const patternPerformanceData = useMemo(() => {
    if (!patterns || patterns.length === 0) return [];
    
    return patterns.map(pattern => ({
      name: formatPatternName(pattern.pattern),
      'Success Rate': pattern.success_rate || 0,
      attempts: pattern.total_attempts || 0,
      correct: pattern.total_correct || 0
    }));
  }, [patterns]);

  // Calculate aggregate stats
  const aggregateStats = useMemo(() => {
    if (!sessions || sessions.length === 0) {
      return {
        totalSessions: 0,
        averageSuccessRate: 0,
        totalWordsAttempted: 0,
        totalWordsRecognized: 0,
        averageResponseTime: 0
      };
    }

    const total = sessions.length;
    const totalWordsAttempted = sessions.reduce((sum, s) => sum + (s.words_attempted || 0), 0);
    const totalWordsRecognized = sessions.reduce((sum, s) => sum + (s.words_recognized || 0), 0);
    const avgSuccess = sessions.reduce((sum, s) => sum + (s.success_rate || 0), 0) / total;
    const avgResponse = sessions.reduce((sum, s) => sum + (s.average_response_time || 0), 0) / total;

    return {
      totalSessions: total,
      averageSuccessRate: avgSuccess.toFixed(1),
      totalWordsAttempted,
      totalWordsRecognized,
      averageResponseTime: avgResponse.toFixed(0)
    };
  }, [sessions]);

  // Color scale for success rates
  const getSuccessColor = (rate) => {
    if (rate >= 80) return '#4CAF50';
    if (rate >= 60) return '#FFC107';
    return '#F44336';
  };

  // Pie chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h3>No Analytics Data Yet</h3>
        <p>Play some games to see your progress and statistics!</p>
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
        <h2>Your Phonics Progress</h2>
        <button onClick={loadAnalytics} className={styles.refreshButton}>
          Refresh
        </button>
      </motion.div>

      {/* Summary Cards */}
      <div className={styles.summaryCards}>
        <motion.div
          className={styles.card}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h3>Total Sessions</h3>
          <p className={styles.bigNumber}>{aggregateStats.totalSessions}</p>
        </motion.div>

        <motion.div
          className={styles.card}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h3>Average Success</h3>
          <p className={styles.bigNumber}>{aggregateStats.averageSuccessRate}%</p>
        </motion.div>

        <motion.div
          className={styles.card}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h3>Words Practiced</h3>
          <p className={styles.bigNumber}>{aggregateStats.totalWordsAttempted}</p>
        </motion.div>

        <motion.div
          className={styles.card}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h3>Words Mastered</h3>
          <p className={styles.bigNumber}>{aggregateStats.totalWordsRecognized}</p>
        </motion.div>
      </div>

      {/* Metric Selector */}
      <div className={styles.metricSelector}>
        <button
          className={selectedMetric === 'successRate' ? styles.active : ''}
          onClick={() => setSelectedMetric('successRate')}
        >
          Success Rate
        </button>
        <button
          className={selectedMetric === 'wordsRecognized' ? styles.active : ''}
          onClick={() => setSelectedMetric('wordsRecognized')}
        >
          Words Recognized
        </button>
        <button
          className={selectedMetric === 'responseTime' ? styles.active : ''}
          onClick={() => setSelectedMetric('responseTime')}
        >
          Response Time
        </button>
        <button
          className={selectedMetric === 'maxStreak' ? styles.active : ''}
          onClick={() => setSelectedMetric('maxStreak')}
        >
          Max Streak
        </button>
      </div>

      {/* Progress Over Time Chart */}
      <motion.div
        className={styles.chartCard}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3>Progress Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={sessionChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="session" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '2px solid #e0e0e0',
                borderRadius: '10px'
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey={selectedMetric}
              name={selectedMetric === 'successRate' ? 'Success Rate' :
                   selectedMetric === 'wordsRecognized' ? 'Words Recognized' :
                   selectedMetric === 'responseTime' ? 'Response Time' : 'Max Streak'}
              stroke="#667eea"
              strokeWidth={3}
              dot={{ fill: '#667eea', r: 6 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      <div className={styles.chartsRow}>
        {/* Pattern Performance */}
        {patternPerformanceData.length > 0 && (
          <motion.div
            className={styles.chartCard}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h3>Pattern Mastery</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={patternPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="name" stroke="#666" angle={-15} textAnchor="end" height={80} />
                <YAxis stroke="#666" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '2px solid #e0e0e0',
                    borderRadius: '10px'
                  }}
                />
                <Legend />
                <Bar dataKey="Success Rate" fill="#4CAF50" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Recent Sessions List */}
        <motion.div
          className={styles.chartCard}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h3>Recent Sessions</h3>
          <div className={styles.sessionsList}>
            {sessions.slice(0, 5).map((session, index) => (
              <div key={session.id || index} className={styles.sessionItem}>
                <div className={styles.sessionDate}>
                  {new Date(session.timestamp).toLocaleDateString()}
                </div>
                <div className={styles.sessionStats}>
                  <span style={{ color: getSuccessColor(session.success_rate) }}>
                    {session.success_rate}% Success
                  </span>
                  <span>{session.words_recognized}/{session.words_attempted} Words</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default GameAnalytics;