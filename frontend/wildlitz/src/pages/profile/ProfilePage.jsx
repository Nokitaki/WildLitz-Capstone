// src/pages/profile/ProfilePage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../styles/components/profile.module.css';
import ModulePerformanceChart from '../profile/ModulePerformanceChart';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout, getUserProgress, getUserAnalytics, isAuthenticated } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'soundsafari' || tabParam === 'achievements') return 'overview';
    return tabParam || 'overview';
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/home');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        
        const [progressData, analyticsData] = await Promise.all([
          getUserProgress().catch((err) => {
            console.error("Progress fetch error:", err);
            return { user_progress: [] };
          }),
          getUserAnalytics().catch((err) => {
            console.error("Analytics fetch error:", err);
            return { 
              overall_stats: { total_activities: 0, total_correct: 0, overall_accuracy: 0 },
              module_stats: {}
            };
          })
        ]);
        
        setProgress(progressData.user_progress || []);
        setAnalytics(analyticsData);
      } catch (err) {
        console.error('Failed to load user data:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user) {
      loadUserData();
    }
  }, [isAuthenticated, user, getUserProgress, getUserAnalytics]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const formatJoinDate = (dateString) => {
    if (!dateString) return 'Today';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return 'Today';
    }
  };

  const getModuleDisplayName = (moduleKey) => {
    const moduleMap = {
      'syllabification': 'Syllable Clapping',
      'phonemics': 'Sound Safari',
      'phonics': 'Vanishing Game',
      'sentence_formation': 'Crossword Quest',
      'syllable_clapping': 'Syllable Clapping',
      'sound_safari': 'Sound Safari',
      'vanishing_game': 'Vanishing Game',
      'crossword': 'Crossword Quest'
    };
    return moduleMap[moduleKey] || moduleKey.replace('_', ' ');
  };

  const getGameRoute = (moduleKey) => {
    switch (moduleKey) {
      case 'sentence_formation': 
      case 'crossword': return '/games/crossword';
      case 'phonics': 
      case 'vanishing_game': return '/games/vanishing';
      case 'syllabification': 
      case 'syllable_clapping': return '/games/syllable';
      case 'phonemics': 
      case 'sound_safari': return '/games/sound-safari';
      default: return '/home';
    }
  };

  const getDisplayDifficulty = (item) => {
    if (!item.difficulty) return '';
    if (item.module === 'sentence_formation' || item.module === 'crossword') {
      const diff = item.difficulty.toLowerCase();
      if (diff === 'medium' || diff === 'easy' || diff === 'hard') {
        return '1 Episode';
      }
    }
    return item.difficulty;
  };

  const getChartConfig = (moduleKey) => {
    switch (moduleKey) {
      case 'sentence_formation': 
      case 'crossword':
        return { xAxisLabel: "Story Episodes", yAxisLabel: "Puzzle Accuracy (%)" };
      case 'phonics': 
      case 'vanishing_game':
        return { xAxisLabel: "Speed / Difficulty", yAxisLabel: "Recognition Rate (%)" };
      case 'syllabification':
      case 'syllable_clapping':
        return { xAxisLabel: "Word Difficulty", yAxisLabel: "Clap Accuracy (%)" };
      default:
        return { xAxisLabel: "Difficulty Level", yAxisLabel: "Accuracy (%)" };
    }
  };

  const groupDataByModule = (data) => {
    return data.reduce((acc, item) => {
      const key = item.module;
      if (!acc[key]) acc[key] = [];

      if (key === 'sentence_formation' || key === 'crossword') {
        const diff = (item.difficulty || '').toLowerCase();
        if (diff === 'medium' || diff === 'easy' || diff === 'hard') {
          const cleanedItem = { ...item, difficulty: '1 Episode' }; 
          acc[key].push(cleanedItem);
          return acc;
        }
      }
      acc[key].push(item);
      return acc;
    }, {});
  };

  // ✅ FIX: Safe calculations for Streak, Rank, Time
  const extendedMetrics = useMemo(() => {
    if (!progress || progress.length === 0) return null;

    // 1. Calculate Total Time (Minutes)
    const totalSeconds = progress.reduce((sum, item) => sum + (item.time_spent || 60), 0);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const timeDisplay = totalMinutes > 60 
      ? `${(totalMinutes / 60).toFixed(1)} hrs` 
      : `${totalMinutes} mins`;

    // 2. Calculate Streak (With Crash Protection)
    // ✅ SAFETY FIX: Filter out items with missing or invalid timestamps first
    const uniqueDates = [...new Set(
      progress
        .filter(item => item.timestamp && !isNaN(new Date(item.timestamp).getTime()))
        .map(item => new Date(item.timestamp).toISOString().split('T')[0])
    )].sort((a, b) => new Date(b) - new Date(a));

    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    // Check if played today or yesterday to start streak
    if (uniqueDates.length > 0 && (uniqueDates[0] === today || uniqueDates[0] === yesterday)) {
      streak = 1;
      let currentDate = new Date(uniqueDates[0]);
      
      for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i]);
        const diffTime = Math.abs(currentDate - prevDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          streak++;
          currentDate = prevDate;
        } else {
          break;
        }
      }
    }

    // 3. Determine Rank Title based on Average Accuracy
    const avgAccuracy = progress.reduce((sum, item) => sum + (item.accuracy_percentage || 0), 0) / progress.length;
    let rankTitle = "Beginner Explorer";
    let rankEmoji = "🌱";
    
    if (avgAccuracy >= 90) { rankTitle = "Word Wizard"; rankEmoji = "🧙‍♂️"; }
    else if (avgAccuracy >= 80) { rankTitle = "Language Master"; rankEmoji = "🦁"; }
    else if (avgAccuracy >= 60) { rankTitle = "Rising Star"; rankEmoji = "⭐"; }
    else if (avgAccuracy >= 40) { rankTitle = "Curious Learner"; rankEmoji = "🧐"; }

    return {
      timeDisplay,
      streak,
      rankTitle,
      rankEmoji
    };
  }, [progress]);

  // Insights Logic
  const insights = useMemo(() => {
    if (!progress || progress.length === 0) return null;

    const moduleStats = {};
    progress.forEach(item => {
      const moduleKey = item.module || 'unknown';
      if (!moduleStats[moduleKey]) {
        moduleStats[moduleKey] = { sum: 0, count: 0, name: getModuleDisplayName(moduleKey) };
      }
      moduleStats[moduleKey].sum += (item.accuracy_percentage || 0);
      moduleStats[moduleKey].count += 1;
    });

    let bestSkill = null;
    let focusArea = null;
    let maxAvg = -1;
    let minAvg = 101;

    Object.keys(moduleStats).forEach(key => {
      const avg = moduleStats[key].sum / moduleStats[key].count;
      if (avg > maxAvg) {
        maxAvg = avg;
        bestSkill = { key, name: moduleStats[key].name, avg: Math.round(avg) };
      }
      if (avg < minAvg) {
        minAvg = avg;
        focusArea = { key, name: moduleStats[key].name, avg: Math.round(avg) };
      }
    });

    if (minAvg === 100) focusArea = null;

    const lastPlayedItem = progress[0]; 
    const lastPlayed = lastPlayedItem ? {
      key: lastPlayedItem.module,
      name: getModuleDisplayName(lastPlayedItem.module),
      difficulty: getDisplayDifficulty(lastPlayedItem)
    } : null;

    return { bestSkill, focusArea, lastPlayed };
  }, [progress]);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className={styles.profileContainer}>
        <div className={styles.loadingState}>
          <motion.div 
            className={styles.loadingSpinner}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            📚
          </motion.div>
          <p>Loading your learning journey...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const groupedProgress = groupDataByModule(progress);
  
  const orderedModules = [
    'syllabification',     
    'phonemics',           
    'phonics',             
    'sentence_formation'   
  ];

  const otherKeys = Object.keys(groupedProgress).filter(key => !orderedModules.includes(key));
  const displayKeys = [...orderedModules.filter(key => groupedProgress[key]), ...otherKeys];

  return (
    <motion.div 
      className={styles.profileContainer}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div className={styles.profileHeader} variants={itemVariants}>
        <div className={styles.headerNavigation}>
          <motion.button 
            className={styles.backButton}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/home')}
          >
            ← Back to Games
          </motion.button>
          <motion.button 
            className={styles.logoutButton}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
          >
            🚪 Logout
          </motion.button>
        </div>

        <div className={styles.profileHero}>
          <div className={styles.profileAvatar}>
            <div className={styles.avatarCircle}>
              <span className={styles.avatarEmoji}>
                {extendedMetrics ? extendedMetrics.rankEmoji : '👤'}
              </span>
            </div>
          </div>
          
          <div className={styles.profileInfo}>
            <h1 className={styles.profileName}>
              Welcome back, {user.first_name || user.username || 'Student'}! 👋
            </h1>
            <p className={styles.profileEmail}>
              {extendedMetrics ? `Rank: ${extendedMetrics.rankTitle}` : user.email}
            </p>
            <p className={styles.profileJoinDate}>
              📅 Learning since {formatJoinDate(user.date_joined)}
            </p>
          </div>

          {analytics && (
            <div className={styles.quickStats}>
              <div className={styles.quickStat}>
                <span className={styles.statNumber}>{analytics.overall_stats.total_activities}</span>
                <span className={styles.statLabel}>Activities</span>
              </div>
              <div className={styles.quickStat}>
                <span className={styles.statNumber}>{Math.round(analytics.overall_stats.overall_accuracy)}%</span>
                <span className={styles.statLabel}>Accuracy</span>
              </div>
              <div className={styles.quickStat}>
                <span className={styles.statNumber}>
                   {extendedMetrics ? extendedMetrics.streak : 0}🔥
                </span>
                <span className={styles.statLabel}>Day Streak</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div className={styles.profileTabs} variants={itemVariants}>
        <button
          className={`${styles.tabButton} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'progress' ? styles.active : ''}`}
          onClick={() => setActiveTab('progress')}
        >
          📈 Progress Charts
        </button>
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className={styles.tabContent}
        >
          {activeTab === 'overview' && (
            <div className={styles.overviewContent}>
              <div className={styles.overviewGrid}>
                
                {/* 1. Learning Summary */}
                <div className={styles.summaryCard}>
                  <h3>🎯 Your Learning Stats</h3>
                  {extendedMetrics ? (
                    <div className={styles.summaryStats}>
                      
                      {/* Metric 1: Time Spent */}
                      <div className={styles.summaryItem}>
                        <span className={styles.summaryIcon}>⏱️</span>
                        <div>
                          <p className={styles.summaryNumber}>{extendedMetrics.timeDisplay}</p>
                          <p className={styles.summaryLabel}>Total Practice Time</p>
                        </div>
                      </div>

                      {/* Metric 2: Rank/Status */}
                      <div className={styles.summaryItem}>
                        <span className={styles.summaryIcon}>🏆</span>
                        <div>
                          <p className={styles.summaryNumber}>{extendedMetrics.rankTitle}</p>
                          <p className={styles.summaryLabel}>Current Rank</p>
                        </div>
                      </div>

                      {/* Metric 3: Streak */}
                      <div className={styles.summaryItem}>
                        <span className={styles.summaryIcon}>🔥</span>
                        <div>
                          <p className={styles.summaryNumber}>{extendedMetrics.streak} Days</p>
                          <p className={styles.summaryLabel}>Current Streak</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className={styles.noData}>Start playing games to see your stats!</p>
                  )}
                </div>

                {/* 2. Recommendations / Insights Card */}
                {insights ? (
                  <div className={styles.nextStepsCard}>
                    <h3>💡 Insights & Recommendations</h3>
                    <div className={styles.suggestions}>
                      {insights.bestSkill && (
                        <div className={styles.suggestionItem} onClick={() => navigate(getGameRoute(insights.bestSkill.key))}>
                          <span className={styles.suggestionIcon}>⭐</span>
                          <div>
                            <p className={styles.suggestionTitle}>Your Super Power: {insights.bestSkill.name}</p>
                            <p className={styles.suggestionDesc}>
                              You have <strong>{insights.bestSkill.avg}% accuracy</strong>! Keep mastering it.
                            </p>
                          </div>
                        </div>
                      )}

                      {insights.focusArea && (
                        <div 
                          className={styles.suggestionItem} 
                          onClick={() => navigate(getGameRoute(insights.focusArea.key))}
                          style={{ borderLeft: '4px solid #FF5722' }}
                        >
                          <span className={styles.suggestionIcon}>🚀</span>
                          <div>
                            <p className={styles.suggestionTitle}>Focus Area: {insights.focusArea.name}</p>
                            <p className={styles.suggestionDesc}>
                              A little practice goes a long way. <strong>Play a round now?</strong>
                            </p>
                          </div>
                        </div>
                      )}

                      {insights.lastPlayed && (
                        <div className={styles.suggestionItem} onClick={() => navigate(getGameRoute(insights.lastPlayed.key))}>
                          <span className={styles.suggestionIcon}>🔄</span>
                          <div>
                            <p className={styles.suggestionTitle}>Jump Back In</p>
                            <p className={styles.suggestionDesc}>
                              Resume <strong>{insights.lastPlayed.name}</strong> {insights.lastPlayed.difficulty ? `(${insights.lastPlayed.difficulty})` : ''}.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={styles.nextStepsCard}>
                    <h3>🚀 Next Steps</h3>
                    <p>Play games to unlock personalized recommendations!</p>
                    <button className={styles.startLearningBtn} onClick={() => navigate('/home')}>
                      Go to Games
                    </button>
                  </div>
                )}

                {/* 3. Recent Activity */}
                <div className={styles.activityCard}>
                  <h3>📅 Recent Activity</h3>
                  {progress.length > 0 ? (
                    <div className={styles.activityList}>
                      {progress.slice(0, 5).map((item, index) => (
                        <motion.div 
                          key={index} 
                          className={styles.activityItem}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => navigate(getGameRoute(item.module))}
                          style={{ cursor: 'pointer' }}
                        >
                          <span className={styles.activityModule}>
                            {getModuleDisplayName(item.module)}
                          </span>
                          <div className={styles.activityInfo}>
                             {item.difficulty && (
                               <span className={styles.difficultyTag}>
                                 {getDisplayDifficulty(item)}
                               </span>
                             )}
                          </div>
                          <span className={styles.activityAccuracy} style={{ 
                            color: item.accuracy_percentage >= 80 ? '#4CAF50' : 
                                   item.accuracy_percentage >= 50 ? '#FFC107' : '#F44336' 
                          }}>
                            {Math.round(item.accuracy_percentage || 0)}%
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.noData}>No recent activity</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'progress' && (
            <div className={styles.progressContent}>
              {displayKeys.length > 0 ? (
                <div className={styles.chartsGrid}>
                  {displayKeys.map((moduleKey) => {
                    const config = getChartConfig(moduleKey);
                    return (
                      <ModulePerformanceChart
                        key={moduleKey}
                        moduleName={getModuleDisplayName(moduleKey)}
                        data={groupedProgress[moduleKey]}
                        xAxisLabel={config.xAxisLabel}
                        yAxisLabel={config.yAxisLabel}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <span className={styles.emptyIcon}>📚</span>
                  <h4>No progress data yet</h4>
                  <p>Start playing games to generate your performance charts!</p>
                  <motion.button
                    className={styles.startLearningBtn}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/home')}
                  >
                    🎮 Start Learning
                  </motion.button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {error && (
        <div className={styles.errorBanner}>
          <p>⚠️ {error}</p>
        </div>
      )}
    </motion.div>
  );
};

export default ProfilePage; 