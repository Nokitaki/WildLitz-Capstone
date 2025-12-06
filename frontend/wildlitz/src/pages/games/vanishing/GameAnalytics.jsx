// src/pages/games/vanishing/GameAnalytics.jsx - COMPACT VERSION
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import styles from '../../../styles/games/vanishing/GameAnalytics.module.css';
import phonicsAnalyticsService from '../../../services/phonicsAnalyticsService';

const GameAnalytics = ({ onBack }) => {
  const [sessions, setSessions] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('successRate');
  const [filterMode, setFilterMode] = useState('all');
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

  const loadAnalytics = async (forceRefresh = false) => {
    try {
      setLoading(true);
      console.log('📊 Loading analytics...', forceRefresh ? '(Forced Refresh)' : '');
      
      const analyticsData = await phonicsAnalyticsService.getUserAnalytics(100);
      if (analyticsData && analyticsData.success) {
        console.log(`✅ Loaded ${analyticsData.sessions?.length || 0} sessions`);
        setSessions(analyticsData.sessions || []);
      } else {
        console.error('❌ Failed to load analytics:', analyticsData);
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

  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    
    if (filterMode === 'solo') {
      return sessions.filter(s => !s.team_play);
    } else if (filterMode === 'team') {
      return sessions.filter(s => s.team_play);
    }
    return sessions;
  }, [sessions, filterMode]);

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

  const patternPerformanceData = useMemo(() => {
    if (!filteredSessions || filteredSessions.length === 0) return [];
    
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
    
    return Object.entries(patternAggregates).map(([pattern, data]) => ({
      name: formatPatternName(pattern),
      'Success Rate': data.totalAttempted > 0 
        ? Math.round((data.totalCorrect / data.totalAttempted) * 100) 
        : 0,
      attempts: data.totalAttempted,
      correct: data.totalCorrect
    }));
  }, [filteredSessions]);

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
      {/* COMPACT Header */}
      <div className={styles.analyticsHeader}>
        <button onClick={onBack} className={styles.backButton}>
          ← Back
        </button>
        <h1 className={styles.analyticsTitle}>📊 Analytics</h1>
        <p className={styles.analyticsSubtitle}>Track your progress</p>
        
        <motion.button
          className={styles.refreshButton}
          onClick={() => loadAnalytics(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🔄
        </motion.button>
      </div>

      {/* COMPACT Filter Tabs */}
      <div className={styles.filterTabs}>
        <motion.button
          className={`${styles.filterTab} ${filterMode === 'all' ? styles.active : ''}`}
          onClick={() => setFilterMode('all')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          All ({sessions.length})
        </motion.button>
        <motion.button
          className={`${styles.filterTab} ${filterMode === 'solo' ? styles.active : ''}`}
          onClick={() => setFilterMode('solo')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Solo ({aggregateStats.soloGames})
        </motion.button>
        <motion.button
          className={`${styles.filterTab} ${filterMode === 'team' ? styles.active : ''}`}
          onClick={() => setFilterMode('team')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Team ({aggregateStats.teamGames})
        </motion.button>
      </div>

      {/* COMPACT Summary Stats - 2x2 Grid */}
      <div className={styles.summaryGrid}>
        <motion.div className={styles.statCard} whileHover={{ scale: 1.02 }}>
          <div className={styles.statIcon}>🎯</div>
          <div className={styles.statValue}>{aggregateStats.totalSessions}</div>
          <div className={styles.statLabel}>Games</div>
        </motion.div>

        <motion.div className={styles.statCard} whileHover={{ scale: 1.02 }}>
          <div className={styles.statIcon}>✨</div>
          <div className={styles.statValue}>{aggregateStats.averageSuccessRate}%</div>
          <div className={styles.statLabel}>Success</div>
        </motion.div>

        <motion.div className={styles.statCard} whileHover={{ scale: 1.02 }}>
          <div className={styles.statIcon}>📖</div>
          <div className={styles.statValue}>{aggregateStats.totalWordsRecognized}</div>
          <div className={styles.statLabel}>Words</div>
        </motion.div>
      </div>

      {/* COMPACT Team Stats */}
      {teamStats && teamStats.totalGames > 0 && (
        <motion.div 
          className={styles.teamStatsCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className={styles.teamStatsTitle}>🏆 Team Stats</h3>
          <div className={styles.teamStatsGrid}>
            <div className={styles.teamStatItem}>
              <span className={styles.teamStatLabel}>Total</span>
              <span className={styles.teamStatValue}>{teamStats.totalGames}</span>
            </div>
            <div className={styles.teamStatItem}>
              <span className={styles.teamStatLabel}>🔵 A Wins</span>
              <span className={styles.teamStatValue}>{teamStats.teamAWins}</span>
            </div>
            <div className={styles.teamStatItem}>
              <span className={styles.teamStatLabel}>🔴 B Wins</span>
              <span className={styles.teamStatValue}>{teamStats.teamBWins}</span>
            </div>
            <div className={styles.teamStatItem}>
              <span className={styles.teamStatLabel}>🤝 Ties</span>
              <span className={styles.teamStatValue}>{teamStats.ties}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* CHARTS SIDE-BY-SIDE */}
      <div className={styles.chartsWrapper}>
        {/* COMPACT Progress Chart */}
        <div className={styles.chartSection}>
          <h3 className={styles.chartTitle}>📈 Progress</h3>
          <div className={styles.metricSelector}>
            <button
              className={`${styles.metricButton} ${selectedMetric === 'successRate' ? styles.active : ''}`}
              onClick={() => setSelectedMetric('successRate')}
            >
              Success %
            </button>
            <button
              className={`${styles.metricButton} ${selectedMetric === 'wordsRecognized' ? styles.active : ''}`}
              onClick={() => setSelectedMetric('wordsRecognized')}
            >
              Words
            </button>
            <button
              className={`${styles.metricButton} ${selectedMetric === 'maxStreak' ? styles.active : ''}`}
              onClick={() => setSelectedMetric('maxStreak')}
            >
              Streak
            </button>
          </div>
          {/* SMALLER GRAPH */}
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={sessionChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="session" tick={{fontSize: 11}} />
              <YAxis tick={{fontSize: 11}} />
              <Tooltip />
              <Legend wrapperStyle={{fontSize: '12px'}} />
              <Line 
                type="monotone" 
                dataKey={selectedMetric} 
                stroke="#667eea" 
                strokeWidth={2}
                dot={{ fill: '#667eea', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* COMPACT Pattern Mastery */}
        <div className={styles.chartSection}>
          <h3 className={styles.chartTitle}>🎯 Patterns</h3>
          {patternPerformanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={patternPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{fontSize: 10}} angle={-15} textAnchor="end" height={60} />
                <YAxis tick={{fontSize: 11}} />
                <Tooltip />
                <Legend wrapperStyle={{fontSize: '12px'}} />
                <Bar dataKey="Success Rate" fill="#4CAF50" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className={styles.noDataMessage}>
              <p>Play more to see pattern mastery!</p>
            </div>
          )}
        </div>
      </div>

      {/* COMPACT Recent Sessions */}
      <div className={styles.sessionsSection}>
        <h3 className={styles.sectionTitle}>📜 Recent Sessions</h3>
        <div className={styles.sessionsList}>
          {filteredSessions.slice(0, 10).map((session, index) => (
            <motion.div
              key={index}
              className={`${styles.sessionCard} ${session.team_play ? styles.teamSession : styles.soloSession}`}
              whileHover={{ scale: 1.01 }}
              onClick={() => setSelectedSession(selectedSession === session ? null : session)}
            >
              <div className={styles.sessionHeader}>
                <span className={styles.sessionType}>
                  {session.team_play ? '👥 Team' : '👤 Solo'}
                </span>
                <span className={styles.sessionDate}>
                  {new Date(session.timestamp).toLocaleDateString()}
                </span>
              </div>

              <div className={styles.sessionStats}>
                <div className={styles.sessionStat}>
                  <div className={styles.sessionStatLabel}>SUCCESS</div>
                  <div className={styles.sessionStatValue}>{session.success_rate || 0}%</div>
                </div>
                <div className={styles.sessionStat}>
                  <div className={styles.sessionStatLabel}>SCORE</div>
                  <div className={styles.sessionStatValue}>
                    {session.words_recognized || 0}/{session.words_attempted || 0}
                  </div>
                </div>
                <div className={styles.sessionStat}>
                  <div className={styles.sessionStatLabel}>PATTERN</div>
                  <div className={styles.sessionStatValue}>
                    {formatPatternName(session.learning_focus)}
                  </div>
                </div>
              </div>

              {session.team_play && session.team_scores && (
                <div className={styles.teamScores}>
                  <div className={styles.teamScore}>
                    <div className={styles.teamName}>
                      {session.team_names?.teamA || 'Team A'}
                    </div>
                    <div className={styles.teamPoints}>{session.team_scores.teamA || 0}</div>
                  </div>
                  <div className={styles.vsText}>VS</div>
                  <div className={styles.teamScore}>
                    <div className={styles.teamName}>
                      {session.team_names?.teamB || 'Team B'}
                    </div>
                    <div className={styles.teamPoints}>{session.team_scores.teamB || 0}</div>
                  </div>
                </div>
              )}

              <AnimatePresence>
                {selectedSession === session && (
                  <motion.div
                    className={styles.expandedDetails}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <div className={styles.expandedStats}>
                      <div className={styles.expandedStat}>
                        <span className={styles.expandedLabel}>Words Attempted</span>
                        <span className={styles.expandedValue}>{session.words_attempted || 0}</span>
                      </div>
                      <div className={styles.expandedStat}>
                        <span className={styles.expandedLabel}>Max Streak</span>
                        <span className={styles.expandedValue}>{session.max_streak || 0}</span>
                      </div>
                      <div className={styles.expandedStat}>
                        <span className={styles.expandedLabel}>Avg Response</span>
                        <span className={styles.expandedValue}>
                          {(session.average_response_time || 0).toFixed(1)}s
                        </span>
                      </div>
                      <div className={styles.expandedStat}>
                        <span className={styles.expandedLabel}>Time Spent</span>
                        <span className={styles.expandedValue}>
                          {Math.floor((session.time_spent || 0) / 1000 / 60)}m {Math.floor((session.time_spent || 0) / 1000 % 60)}s
                        </span>
                      </div>
                      <div className={styles.expandedStat}>
                      <span className={styles.expandedLabel}>⏰ Time Limit</span>
                      <span className={styles.expandedValue}>
                        {session.difficulty === 'easy' ? '30s' : 
                        session.difficulty === 'medium' ? '25s' : '20s'}
                      </span>
                    </div>
                      <div className={styles.expandedStat}>
                        <span className={styles.expandedLabel}>⏱️ Timeouts</span>
                        <span className={styles.expandedValue}>
                          {(() => {
                            // Count actual timeouts from difficulty progression
                            const progression = session.difficulty_progression || [];
                            const timeouts = progression.filter(p => p.action === 'timeout').length;
                            return timeouts;
                          })()}
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