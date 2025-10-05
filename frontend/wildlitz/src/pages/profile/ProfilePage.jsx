// src/pages/profile/ProfilePage.jsx - COMPLETE FILE WITH SOUND SAFARI ANALYTICS
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../styles/components/profile.module.css';
import SoundSafariAnalytics from '../games/soundsafari/SoundSafariAnalytics';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout, getUserProgress, getUserAnalytics, isAuthenticated } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/home');
    }
  }, [isAuthenticated, navigate]);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        
        // Load progress and analytics
        const [progressData, analyticsData] = await Promise.all([
          getUserProgress().catch(() => ({ user_progress: [] })),
          getUserAnalytics().catch(() => ({ 
            overall_stats: { total_activities: 0, total_correct: 0, overall_accuracy: 0 },
            module_stats: {}
          }))
        ]);
        
        setProgress(progressData.user_progress || []);
        setAnalytics(analyticsData);
        setError(null);
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getModuleDisplayName = (module) => {
    const moduleNames = {
      'syllable_clapping': 'Syllable Clapping',
      'sound_safari': 'Sound Safari',
      'vanishing_game': 'Vanishing Game',
      'crossword': 'Crossword Puzzle'
    };
    return moduleNames[module] || module;
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        staggerChildren: 0.1
      }
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

  if (!user) {
    return null;
  }

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
              Welcome back, {user.first_name}! 👋
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
          📈 Progress
        </button>
        {/* NEW: Sound Safari Tab */}
        <button
          className={`${styles.tabButton} ${activeTab === 'soundsafari' ? styles.active : ''}`}
          onClick={() => setActiveTab('soundsafari')}
        >
          🦁 Sound Safari
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'achievements' ? styles.active : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          🏆 Achievements
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

                {/* Recent Activity */}
                <div className={styles.activityCard}>
                  <h3>📅 Recent Activity</h3>
                  {progress.length > 0 ? (
                    <div className={styles.activityList}>
                      {progress.slice(0, 5).map((item, index) => (
                        <div key={index} className={styles.activityItem}>
                          <span className={styles.activityModule}>
                            {getModuleDisplayName(item.module)}
                          </span>
                          <span className={styles.activityAccuracy}>
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
              <h3>📊 Your Learning Progress</h3>
              {progress.length > 0 ? (
                <div className={styles.progressGrid}>
                  {progress.map((item, index) => (
                    <motion.div
                      key={index}
                      className={styles.progressCard}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <h4>{getModuleDisplayName(item.module)}</h4>
                      <div className={styles.progressStats}>
                        <div className={styles.progressStat}>
                          <span className={styles.statLabel}>Difficulty</span>
                          <span className={styles.statValue}>{item.difficulty}</span>
                        </div>
                        <div className={styles.progressStat}>
                          <span className={styles.statLabel}>Accuracy</span>
                          <span className={styles.statValue}>{Math.round(item.accuracy_percentage)}%</span>
                        </div>
                        <div className={styles.progressStat}>
                          <span className={styles.statLabel}>Attempts</span>
                          <span className={styles.statValue}>{item.total_attempts}</span>
                        </div>
                        <div className={styles.progressStat}>
                          <span className={styles.statLabel}>Correct</span>
                          <span className={styles.statValue}>{item.correct_answers}</span>
                        </div>
                      </div>
                      
                      <div className={styles.progressBar}>
                        <motion.div 
                          className={styles.progressFill}
                          initial={{ width: 0 }}
                          animate={{ width: `${item.accuracy_percentage}%` }}
                          transition={{ duration: 1, delay: index * 0.1 }}
                          style={{
                            backgroundColor: item.accuracy_percentage >= 80 ? '#4CAF50' : 
                                           item.accuracy_percentage >= 60 ? '#FFC107' : '#F44336'
                          }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <span className={styles.emptyIcon}>📚</span>
                  <h4>No progress data yet</h4>
                  <p>Start playing games to track your learning progress!</p>
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

          {/* NEW: Sound Safari Analytics Tab */}
          {activeTab === 'soundsafari' && (
            <div className={styles.soundSafariContent}>
              <SoundSafariAnalytics />
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className={styles.achievementsContent}>
              <div className={styles.achievementsHeader}>
                <h3>🏆 Achievements</h3>
                <p>Celebrate your learning milestones!</p>
              </div>
              
              <div className={styles.achievementsGrid}>
                {/* Sample achievements */}
                <div className={`${styles.achievementCard} ${analytics?.overall_stats.total_activities > 0 ? styles.unlocked : styles.locked}`}>
                  <div className={styles.achievementIcon}>🎮</div>
                  <div className={styles.achievementInfo}>
                    <h4>First Steps</h4>
                    <p>Complete your first game activity</p>
                  </div>
                  <div className={styles.achievementStatus}>
                    {analytics?.overall_stats.total_activities > 0 ? '✅' : '🔒'}
                  </div>
                </div>

                <div className={`${styles.achievementCard} ${analytics?.overall_stats.total_activities >= 10 ? styles.unlocked : styles.locked}`}>
                  <div className={styles.achievementIcon}>🔥</div>
                  <div className={styles.achievementInfo}>
                    <h4>Getting Warmed Up</h4>
                    <p>Complete 10 activities</p>
                  </div>
                  <div className={styles.achievementStatus}>
                    {analytics?.overall_stats.total_activities >= 10 ? '✅' : `${analytics?.overall_stats.total_activities || 0}/10`}
                  </div>
                </div>

                <div className={`${styles.achievementCard} ${analytics?.overall_stats.overall_accuracy >= 80 ? styles.unlocked : styles.locked}`}>
                  <div className={styles.achievementIcon}>🎯</div>
                  <div className={styles.achievementInfo}>
                    <h4>Sharp Shooter</h4>
                    <p>Achieve 80% overall accuracy</p>
                  </div>
                  <div className={styles.achievementStatus}>
                    {analytics?.overall_stats.overall_accuracy >= 80 ? '✅' : `${Math.round(analytics?.overall_stats.overall_accuracy || 0)}%`}
                  </div>
                </div>

                <div className={`${styles.achievementCard} ${styles.locked}`}>
                  <div className={styles.achievementIcon}>🌟</div>
                  <div className={styles.achievementInfo}>
                    <h4>Perfect Score</h4>
                    <p>Get 100% accuracy in any game</p>
                  </div>
                  <div className={styles.achievementStatus}>🔒</div>
                </div>

                <div className={`${styles.achievementCard} ${styles.locked}`}>
                  <div className={styles.achievementIcon}>🚀</div>
                  <div className={styles.achievementInfo}>
                    <h4>Speed Learner</h4>
                    <p>Complete 50 activities</p>
                  </div>
                  <div className={styles.achievementStatus}>🔒</div>
                </div>

                <div className={`${styles.achievementCard} ${styles.locked}`}>
                  <div className={styles.achievementIcon}>👑</div>
                  <div className={styles.achievementInfo}>
                    <h4>Reading Master</h4>
                    <p>Complete all game types</p>
                  </div>
                  <div className={styles.achievementStatus}>🔒</div>
                </div>
              </div>
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