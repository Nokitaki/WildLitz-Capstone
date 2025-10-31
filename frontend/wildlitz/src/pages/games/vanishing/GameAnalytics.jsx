// src/pages/games/vanishing/GameAnalytics.jsx - ENHANCED WITH TEAM SUPPORT
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import styles from '../../../styles/games/vanishing/GameAnalytics.module.css';
import phonicsAnalyticsService from '../../../services/phonicsAnalyticsService';

const GameAnalytics = ({ onBack }) => {
  const [sessions, setSessions] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('successRate');
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'solo', 'team'
  const [selectedSession, setSelectedSession] = useState(null);

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
      
      const analyticsData = await phonicsAnalyticsService.getUserAnalytics(50);
      if (analyticsData && analyticsData.success) {
        setSessions(analyticsData.sessions || []);
      }
      
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

  // Filter sessions based on mode
  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    
    if (filterMode === 'solo') {
      return sessions.filter(s => !s.team_play);
    } else if (filterMode === 'team') {
      return sessions.filter(s => s.team_play);
    }
    return sessions;
  }, [sessions, filterMode]);

  // Calculate team statistics
  const teamStats = useMemo(() => {
    if (!sessions) return null;
    
    const teamGames = sessions.filter(s => s.team_play && s.team_scores);
    
    if (teamGames.length === 0) return null;
    
    let totalGames = 0;
    let teamAWins = 0;
    let teamBWins = 0;
    let ties = 0;
    const teamMatchups = {};
    
    teamGames.forEach(game => {
      if (game.team_scores && game.team_scores.teamA !== undefined && game.team_scores.teamB !== undefined) {
        totalGames++;
        
        const scoreA = game.team_scores.teamA || 0;
        const scoreB = game.team_scores.teamB || 0;
        
        if (scoreA > scoreB) teamAWins++;
        else if (scoreB > scoreA) teamBWins++;
        else ties++;
        
        // Track matchups
        if (game.team_names) {
          const matchup = `${game.team_names.teamA} vs ${game.team_names.teamB}`;
          teamMatchups[matchup] = (teamMatchups[matchup] || 0) + 1;
        }
      }
    });
    
    return {
      totalGames,
      teamAWins,
      teamBWins,
      ties,
      mostFrequentMatchup: Object.entries(teamMatchups).sort((a, b) => b[1] - a[1])[0]
    };
  }, [sessions]);

  // Format session data for charts
  const sessionChartData = useMemo(() => {
    if (!filteredSessions || filteredSessions.length === 0) return [];
    
    return filteredSessions
      .slice(0, 10)
      .reverse()
      .map((session, index) => ({
        session: `#${index + 1}`,
        successRate: session.success_rate || 0,
        wordsRecognized: session.words_recognized || 0,
        responseTime: session.average_response_time || 0,
        maxStreak: session.max_streak || 0,
        date: new Date(session.timestamp).toLocaleDateString(),
        isTeamPlay: session.team_play || false
      }));
  }, [filteredSessions]);

  // Format pattern performance data - FIX: Calculate from sessions
  const patternPerformanceData = useMemo(() => {
    if (!filteredSessions || filteredSessions.length === 0) return [];
    
    // Aggregate pattern stats from all sessions
    const patternAggregates = {};
    
    filteredSessions.forEach(session => {
      const focus = session.learning_focus;
      if (!focus) return;
      
      if (!patternAggregates[focus]) {
        patternAggregates[focus] = {
          totalAttempted: 0,
          totalCorrect: 0,
          count: 0
        };
      }
      
      patternAggregates[focus].totalAttempted += session.words_attempted || 0;
      patternAggregates[focus].totalCorrect += session.words_recognized || 0;
      patternAggregates[focus].count++;
    });
    
    // Convert to chart format
    return Object.entries(patternAggregates).map(([pattern, data]) => ({
      name: formatPatternName(pattern),
      'Success Rate': data.totalAttempted > 0 
        ? Math.round((data.totalCorrect / data.totalAttempted) * 100) 
        : 0,
      attempts: data.totalAttempted,
      correct: data.totalCorrect
    }));
  }, [filteredSessions]);

  // Calculate aggregate stats
  const aggregateStats = useMemo(() => {
    if (!filteredSessions || filteredSessions.length === 0) {
      return {
        totalSessions: 0,
        averageSuccessRate: 0,
        totalWordsAttempted: 0,
        totalWordsRecognized: 0,
        averageResponseTime: 0,
        soloGames: 0,
        teamGames: 0
      };
    }

    const total = filteredSessions.length;
    const soloGames = sessions.filter(s => !s.team_play).length;
    const teamGames = sessions.filter(s => s.team_play).length;
    const totalWordsAttempted = filteredSessions.reduce((sum, s) => sum + (s.words_attempted || 0), 0);
    const totalWordsRecognized = filteredSessions.reduce((sum, s) => sum + (s.words_recognized || 0), 0);
    const avgSuccess = filteredSessions.reduce((sum, s) => sum + (s.success_rate || 0), 0) / total;
    const avgResponseTime = filteredSessions.reduce((sum, s) => sum + (s.average_response_time || 0), 0) / total;

    return {
      totalSessions: total,
      averageSuccessRate: Math.round(avgSuccess),
      totalWordsAttempted,
      totalWordsRecognized,
      averageResponseTime: Math.round(avgResponseTime),
      soloGames,
      teamGames
    };
  }, [filteredSessions, sessions]);

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe'];

  if (loading) {
    return (
      <div className={styles.analyticsContainer}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.analyticsContainer}>
      {/* Header */}
      <div className={styles.analyticsHeader}>
        <button onClick={onBack} className={styles.backButton}>
          ← Back to Game
        </button>
        <h1 className={styles.analyticsTitle}>📊 Game Analytics</h1>
        <p className={styles.analyticsSubtitle}>Track your phonics learning progress</p>
      </div>

      {/* Filter Tabs */}
      <div className={styles.filterTabs}>
        <motion.button
          className={`${styles.filterTab} ${filterMode === 'all' ? styles.active : ''}`}
          onClick={() => setFilterMode('all')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🎮 All Games ({sessions.length})
        </motion.button>
        <motion.button
          className={`${styles.filterTab} ${filterMode === 'solo' ? styles.active : ''}`}
          onClick={() => setFilterMode('solo')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          👤 Solo ({aggregateStats.soloGames})
        </motion.button>
        <motion.button
          className={`${styles.filterTab} ${filterMode === 'team' ? styles.active : ''}`}
          onClick={() => setFilterMode('team')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          👥 Team ({aggregateStats.teamGames})
        </motion.button>
      </div>

      {/* Summary Stats */}
      <div className={styles.summaryGrid}>
        <motion.div 
          className={styles.statCard}
          whileHover={{ scale: 1.05 }}
        >
          <div className={styles.statIcon}>🎯</div>
          <div className={styles.statValue}>{aggregateStats.totalSessions}</div>
          <div className={styles.statLabel}>Total Games</div>
        </motion.div>

        <motion.div 
          className={styles.statCard}
          whileHover={{ scale: 1.05 }}
        >
          <div className={styles.statIcon}>✨</div>
          <div className={styles.statValue}>{aggregateStats.averageSuccessRate}%</div>
          <div className={styles.statLabel}>Avg Success Rate</div>
        </motion.div>

        <motion.div 
          className={styles.statCard}
          whileHover={{ scale: 1.05 }}
        >
          <div className={styles.statIcon}>📖</div>
          <div className={styles.statValue}>{aggregateStats.totalWordsRecognized}</div>
          <div className={styles.statLabel}>Words Mastered</div>
        </motion.div>

        <motion.div 
          className={styles.statCard}
          whileHover={{ scale: 1.05 }}
        >
          <div className={styles.statIcon}>⚡</div>
          <div className={styles.statValue}>{(aggregateStats.averageResponseTime / 1000).toFixed(1)}s</div>
          <div className={styles.statLabel}>Avg Response</div>
        </motion.div>
      </div>

      {/* Team Statistics Card - Only show if there are team games */}
      {teamStats && teamStats.totalGames > 0 && (
        <motion.div 
          className={styles.teamStatsCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className={styles.teamStatsTitle}>🏆 Team Play Statistics</h3>
          <div className={styles.teamStatsGrid}>
            <div className={styles.teamStatItem}>
              <span className={styles.teamStatLabel}>Total Team Games</span>
              <span className={styles.teamStatValue}>{teamStats.totalGames}</span>
            </div>
            <div className={styles.teamStatItem}>
              <span className={styles.teamStatLabel}>🔵 Team A Wins</span>
              <span className={styles.teamStatValue}>{teamStats.teamAWins}</span>
            </div>
            <div className={styles.teamStatItem}>
              <span className={styles.teamStatLabel}>🔴 Team B Wins</span>
              <span className={styles.teamStatValue}>{teamStats.teamBWins}</span>
            </div>
            <div className={styles.teamStatItem}>
              <span className={styles.teamStatLabel}>🤝 Ties</span>
              <span className={styles.teamStatValue}>{teamStats.ties}</span>
            </div>
          </div>
          {teamStats.mostFrequentMatchup && (
            <div className={styles.popularMatchup}>
              <span className={styles.popularMatchupLabel}>Most Frequent Matchup:</span>
              <span className={styles.popularMatchupValue}>
                {teamStats.mostFrequentMatchup[0]} ({teamStats.mostFrequentMatchup[1]} games)
              </span>
            </div>
          )}
        </motion.div>
      )}

      {/* Progress Chart */}
      <div className={styles.chartSection}>
        <h3 className={styles.chartTitle}>📈 Performance Over Time</h3>
        <div className={styles.metricSelector}>
          <button
            className={`${styles.metricButton} ${selectedMetric === 'successRate' ? styles.active : ''}`}
            onClick={() => setSelectedMetric('successRate')}
          >
            Success Rate
          </button>
          <button
            className={`${styles.metricButton} ${selectedMetric === 'wordsRecognized' ? styles.active : ''}`}
            onClick={() => setSelectedMetric('wordsRecognized')}
          >
            Words Recognized
          </button>
          <button
            className={`${styles.metricButton} ${selectedMetric === 'maxStreak' ? styles.active : ''}`}
            onClick={() => setSelectedMetric('maxStreak')}
          >
            Max Streak
          </button>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={sessionChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="session" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey={selectedMetric} 
              stroke="#667eea" 
              strokeWidth={2}
              dot={{ fill: '#667eea', r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pattern Mastery */}
      <div className={styles.chartSection}>
        <h3 className={styles.chartTitle}>🎯 Pattern Mastery</h3>
        {patternPerformanceData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={patternPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Success Rate" fill="#4CAF50" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className={styles.noDataMessage}>
            <p>🎮 Play more games with different patterns to see your mastery!</p>
            <p className={styles.noDataHint}>Try: Blends, Digraphs, Long Vowels, Short Vowels</p>
          </div>
        )}
      </div>

      {/* Recent Sessions List */}
      <div className={styles.sessionsSection}>
        <h3 className={styles.sectionsTitle}>📜 Recent Sessions</h3>
        <div className={styles.sessionsList}>
          {filteredSessions.slice(0, 10).map((session, index) => (
            <motion.div
              key={index}
              className={`${styles.sessionCard} ${session.team_play ? styles.teamSession : styles.soloSession}`}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedSession(selectedSession === session ? null : session)}
            >
              <div className={styles.sessionHeader}>
                <span className={styles.sessionType}>
                  {session.team_play ? '👥 Team Play' : '👤 Solo'}
                </span>
                <span className={styles.sessionDate}>
                  {new Date(session.timestamp).toLocaleDateString()}
                </span>
              </div>
              <div className={styles.sessionStats}>
                <span className={styles.sessionStat}>
                  📊 {session.success_rate || 0}%
                </span>
                <span className={styles.sessionStat}>
                  ✅ {session.words_recognized || 0}/{session.words_attempted || 0}
                </span>
                <span className={styles.sessionStat}>
                  🎯 {formatPatternName(session.learning_focus)}
                </span>
              </div>
              
              {/* Team Details - Show if team play */}
              {session.team_play && session.team_scores && session.team_names && (
                <div className={styles.teamDetails}>
                  <div className={styles.teamScore}>
                    <span className={styles.teamName}>🔵 {session.team_names.teamA}</span>
                    <span className={styles.teamPoints}>{session.team_scores.teamA}</span>
                  </div>
                  <span className={styles.teamVsDivider}>VS</span>
                  <div className={styles.teamScore}>
                    <span className={styles.teamName}>🔴 {session.team_names.teamB}</span>
                    <span className={styles.teamPoints}>{session.team_scores.teamB}</span>
                  </div>
                </div>
              )}
              
              {/* Expanded Details */}
              <AnimatePresence>
                {selectedSession === session && (
                  <motion.div
                    className={styles.sessionExpanded}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <div className={styles.expandedStats}>
                      <div className={styles.expandedStat}>
                        <span className={styles.expandedLabel}>Challenge Level</span>
                        <span className={styles.expandedValue}>{formatPatternName(session.challenge_level)}</span>
                      </div>
                      <div className={styles.expandedStat}>
                        <span className={styles.expandedLabel}>Difficulty</span>
                        <span className={styles.expandedValue}>{session.difficulty}</span>
                      </div>
                      <div className={styles.expandedStat}>
                        <span className={styles.expandedLabel}>Max Streak</span>
                        <span className={styles.expandedValue}>{session.max_streak || 0}</span>
                      </div>
                      <div className={styles.expandedStat}>
                        <span className={styles.expandedLabel}>Avg Response</span>
                        <span className={styles.expandedValue}>
                          {((session.average_response_time || 0) / 1000).toFixed(1)}s
                        </span>
                      </div>
                      <div className={styles.expandedStat}>
                        <span className={styles.expandedLabel}>Time Spent</span>
                        <span className={styles.expandedValue}>
                          {Math.floor((session.time_spent || 0) / 1000 / 60)}m {Math.floor((session.time_spent || 0) / 1000 % 60)}s
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameAnalytics;