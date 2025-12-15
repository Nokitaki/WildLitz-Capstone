// src/pages/profile/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
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
        
        // Load real data from backend
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Helper to get nice names for games
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

  // ✅ NEW HELPER: Format Difficulty for Recent Activity List
  const getDisplayDifficulty = (item) => {
    if (!item.difficulty) return '';

    // Check if it's Crossword
    if (item.module === 'sentence_formation' || item.module === 'crossword') {
      const diff = item.difficulty.toLowerCase();
      // If it's the old format (easy/medium/hard), show "1 Episode"
      if (diff === 'medium' || diff === 'easy' || diff === 'hard') {
        return '1 Episode';
      }
    }
    // Otherwise return the difficulty as is (e.g., "2 Episode", "Level 1")
    return item.difficulty;
  };

  // ✅ HELPER: Customized Chart Labels per Game
  const getChartConfig = (moduleKey) => {
    switch (moduleKey) {
      case 'sentence_formation': // Crossword
      case 'crossword':
        return {
          xAxisLabel: "Story Episodes", 
          yAxisLabel: "Puzzle Accuracy (%)"
        };
      case 'phonics': // Vanishing
      case 'vanishing_game':
        return {
          xAxisLabel: "Speed / Difficulty",
          yAxisLabel: "Recognition Rate (%)"
        };
      case 'syllabification':
      case 'syllable_clapping':
        return {
          xAxisLabel: "Word Difficulty",
          yAxisLabel: "Clap Accuracy (%)"
        };
      default:
        return {
          xAxisLabel: "Difficulty Level",
          yAxisLabel: "Accuracy (%)"
        };
    }
  };

  // ✅ Helper: Group AND Clean data
  const groupDataByModule = (data) => {
    return data.reduce((acc, item) => {
      const key = item.module;
      if (!acc[key]) {
        acc[key] = [];
      }

      // 🔥 DATA CLEANER: Fix old "Medium" labels for Crossword
      if (key === 'sentence_formation' || key === 'crossword') {
        const diff = (item.difficulty || '').toLowerCase();
        // Force old "medium/easy/hard" to "1 Episode"
        if (diff === 'medium' || diff === 'easy' || diff === 'hard') {
          const cleanedItem = { ...item, difficulty: '1 Episode' }; // <--- Change to "1 Episode"
          acc[key].push(cleanedItem);
          return acc;
        }
      }

      // Default behavior
      acc[key].push(item);
      return acc;
    }, {});
  };

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

  // Prepare grouped data with cleaning
  const groupedProgress = groupDataByModule(progress);
  
  // Define strict display order
  const orderedModules = [
    'syllabification',     
    'phonemics',           
    'phonics',             
    'sentence_formation'   
  ];

  const otherKeys = Object.keys(groupedProgress).filter(
    key => !orderedModules.includes(key)
  );
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
              <span className={styles.avatarEmoji}>👤</span>
            </div>
          </div>
          
          <div className={styles.profileInfo}>
            <h1 className={styles.profileName}>
              Welcome back, {user.first_name || user.username || 'Student'}! 👋
            </h1>
            <p className={styles.profileEmail}>{user.email}</p>
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
                <span className={styles.statNumber}>{analytics.overall_stats.total_correct}</span>
                <span className={styles.statLabel}>Correct</span>
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
                {/* Learning Summary */}
                <div className={styles.summaryCard}>
                  <h3>🎯 Learning Summary</h3>
                  {analytics ? (
                    <div className={styles.summaryStats}>
                      <div className={styles.summaryItem}>
                        <span className={styles.summaryIcon}>🎮</span>
                        <div>
                          <p className={styles.summaryNumber}>{analytics.overall_stats.total_activities}</p>
                          <p className={styles.summaryLabel}>Games Played</p>
                        </div>
                      </div>
                      <div className={styles.summaryItem}>
                        <span className={styles.summaryIcon}>✅</span>
                        <div>
                          <p className={styles.summaryNumber}>{analytics.overall_stats.total_correct}</p>
                          <p className={styles.summaryLabel}>Correct Answers</p>
                        </div>
                      </div>
                      <div className={styles.summaryItem}>
                        <span className={styles.summaryIcon}>🎯</span>
                        <div>
                          <p className={styles.summaryNumber}>{Math.round(analytics.overall_stats.overall_accuracy)}%</p>
                          <p className={styles.summaryLabel}>Overall Accuracy</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className={styles.noData}>Start playing games to see your progress!</p>
                  )}
                </div>

                {/* Recent Activity List */}
                <div className={styles.activityCard}>
                  <h3>📅 Recent Activity</h3>
                  {progress.length > 0 ? (
                    <div className={styles.activityList}>
                      {progress.slice(0, 5).map((item, index) => (
                        <div key={index} className={styles.activityItem}>
                          <span className={styles.activityModule}>
                            {getModuleDisplayName(item.module)}
                          </span>
                          <div className={styles.activityInfo}>
                             {/* 🔥 UPDATED: Use the helper function here */}
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
                            {Math.round(item.accuracy_percentage)}%
                          </span>
                        </div>
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