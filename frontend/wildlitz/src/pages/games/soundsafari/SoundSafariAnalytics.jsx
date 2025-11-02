// frontend/wildlitz/src/pages/games/soundsafari/SoundSafariAnalytics.jsx
// UPDATED: Shows sessions list, click to see rounds detail

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import styles from '../../../styles/games/safari/SoundSafariAnalytics.module.css';
import soundSafariAnalyticsService from '../../../services/soundSafariAnalyticsService';

const SoundSafariAnalytics = () => {
  const [sessions, setSessions] = useState([]);
  const [soundPerformance, setSoundPerformance] = useState([]);
  const [aggregateStats, setAggregateStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // NEW: Session detail modal state
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionRounds, setSessionRounds] = useState([]);
  const [loadingRounds, setLoadingRounds] = useState(false);
  const [showModal, setShowModal] = useState(false);

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

  /**
   * NEW: Load rounds for a specific session
   */
  const loadSessionRounds = async (sessionId) => {
    try {
      setLoadingRounds(true);
      
      const response = await soundSafariAnalyticsService.getSessionRounds(sessionId);
      
      if (response && response.success) {
        setSelectedSession(response.session);
        setSessionRounds(response.rounds || []);
        setShowModal(true);
      }
      
    } catch (error) {
      console.error('Error loading session rounds:', error);
    } finally {
      setLoadingRounds(false);
    }
  };

  /**
   * Close modal
   */
  const closeModal = () => {
    setShowModal(false);
    setSelectedSession(null);
    setSessionRounds([]);
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
        totalCorrect: session.total_correct || 0,
        date: new Date(session.played_at).toLocaleDateString()
      }));
  }, [sessions]);

  // Format sound performance data
  const soundPerformanceData = useMemo(() => {
    if (!soundPerformance || soundPerformance.length === 0) return [];
    
    return soundPerformance.map(sound => ({
      name: `${sound.sound.toUpperCase()} (${sound.position})`,
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

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}>🦁</div>
        <p>Loading your Sound Safari progress...</p>
      </div>
    );
  }

  // Empty state
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
      {/* Header */}
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
            <p className={styles.cardValue}>{aggregateStats?.total_sessions || 0}</p>
          </div>
        </motion.div>

        <motion.div
          className={styles.summaryCard}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className={styles.cardIcon}>✅</div>
          <div className={styles.cardContent}>
            <h3>Total Correct</h3>
            <p className={styles.cardValue}>{aggregateStats?.total_correct || 0}</p>
          </div>
        </motion.div>

        <motion.div
          className={styles.summaryCard}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className={styles.cardIcon}>📊</div>
          <div className={styles.cardContent}>
            <h3>Avg Success Rate</h3>
            <p className={styles.cardValue}>
              {aggregateStats?.average_success_rate?.toFixed(1) || 0}%
            </p>
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
            <p className={styles.cardValue}>
              {aggregateStats?.average_time_per_game?.toFixed(0) || 0}s
            </p>
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className={styles.chartsGrid}>
        {/* Success Rate Chart */}
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

        {/* Sound Performance Chart */}
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
              <XAxis dataKey="name" stroke="#fff" angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#fff" domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#5D4037', 
                  border: '2px solid #FFD700',
                  borderRadius: '10px'
                }}
              />
              <Legend />
              <Bar dataKey="Success Rate" fill="#4ECDC4" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Sessions Table - NEW: Clickable rows */}
      <motion.div
        className={styles.sessionsTable}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <h3>📋 Recent Sessions (Click to view rounds)</h3>
        <div className={styles.tableContainer}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Difficulty</th>
                <th>Correct</th>
                <th>Incorrect</th>
                <th>Success Rate</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session, index) => (
                <motion.tr
                  key={session.session_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.05 }}
                  onClick={() => loadSessionRounds(session.session_id)}
                  className={styles.clickableRow}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{formatDate(session.played_at)}</td>
                  <td>
                    <span className={styles.difficultyBadge}>
                      {session.difficulty}
                    </span>
                  </td>
                  <td className={styles.correctCount}>{session.total_correct}</td>
                  <td className={styles.incorrectCount}>{session.total_incorrect}</td>
                  <td>
                    <span 
                      className={styles.successRate}
                      style={{ color: getSuccessColor(session.success_rate) }}
                    >
                      {session.success_rate?.toFixed(1)}%
                    </span>
                  </td>
                  <td>{session.time_spent}s</td>
                  <td>
                    {session.completed ? (
                      <span className={styles.completedBadge}>✓ Complete</span>
                    ) : (
                      <span className={styles.incompleteBadge}>⚠ Incomplete</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Session Rounds Modal - NEW */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className={styles.modalContent}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>📊 Session Details</h2>
                <button onClick={closeModal} className={styles.closeButton}>✕</button>
              </div>

              {loadingRounds ? (
                <div className={styles.modalLoading}>
                  <div className={styles.spinner}>🔄</div>
                  <p>Loading rounds...</p>
                </div>
              ) : (
                <>
                  {/* Session Summary */}
                  <div className={styles.sessionSummary}>
                    <div className={styles.summaryItem}>
                      <span className={styles.label}>Date:</span>
                      <span className={styles.value}>
                        {selectedSession && formatDate(selectedSession.played_at)}
                      </span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.label}>Difficulty:</span>
                      <span className={styles.value}>{selectedSession?.difficulty}</span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.label}>Total Correct:</span>
                      <span className={styles.value}>{selectedSession?.total_correct}</span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.label}>Success Rate:</span>
                      <span 
                        className={styles.value}
                        style={{ color: getSuccessColor(selectedSession?.success_rate || 0) }}
                      >
                        {selectedSession?.success_rate?.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Rounds Table */}
                  <div className={styles.roundsTable}>
                    <h3>Round Breakdown</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Round</th>
                          <th>Sound</th>
                          <th>Position</th>
                          <th>Environment</th>
                          <th>Correct</th>
                          <th>Incorrect</th>
                          <th>Total</th>
                          <th>Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessionRounds.map((round) => {
                          const roundSuccessRate = round.total > 0 
                            ? (round.correct / round.total * 100) 
                            : 0;
                          
                          return (
                            <tr key={round.round_id}>
                              <td>{round.round_number}</td>
                              <td className={styles.soundCell}>
                                {round.target_sound.toUpperCase()}
                              </td>
                              <td>{round.sound_position}</td>
                              <td>{round.environment}</td>
                              <td className={styles.correctCount}>{round.correct}</td>
                              <td className={styles.incorrectCount}>{round.incorrect}</td>
                              <td>{round.total}</td>
                              <td>
                                <span 
                                  className={styles.roundRate}
                                  style={{ color: getSuccessColor(roundSuccessRate) }}
                                >
                                  {roundSuccessRate.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SoundSafariAnalytics;