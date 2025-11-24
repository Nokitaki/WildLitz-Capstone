// SummaryScreen.jsx - FINAL FIXED VERSION 🎨
// ✅ Buttons in ONE LINE
// ✅ Animation error FIXED
// ✅ Episode-based completion FIXED

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../../styles/games/crossword/SummaryScreen.module.css';
import crosswordAnalyticsService from '../../../services/crosswordAnalyticsService';

const SummaryScreen = ({ 
  solvedWords = [], 
  isStoryMode = false,
  storySegment = null,
  currentEpisode = 1,
  totalEpisodes = 1,
  hasNextEpisode = false,
  onPlayAgain,
  onReturnToMenu,
  theme = "adventure",
  sessionId,
  timeSpent = 0,
  totalWords = 0,
  totalHints = 0,
  questionStats = {},
  calculatedAccuracy = 0
}) => {

  const [selectedWord, setSelectedWord] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);

  const performanceMetrics = useMemo(() => {
    const wordsCount = solvedWords.length;
    const episodeProgress = Math.round((currentEpisode / totalEpisodes) * 100);
    
    return {
      wordsCount,
      episodeProgress
    };
  }, [solvedWords.length, currentEpisode, totalEpisodes]);

  useEffect(() => {
    const logAnalytics = async () => {
      if (!sessionId) {
        console.log('No session ID available');
        return;
      }

      try {
        const totalAttempts = Object.values(questionStats).reduce((sum, q) => sum + q.attempts, 0);
        const correctAttempts = Object.values(questionStats).filter(q => q.finalAttempt).length;

       await crosswordAnalyticsService.logGameCompleted(
            sessionId,
            {
              wordsLearned: solvedWords.length,
              totalTime: timeSpent,
              totalHints: totalHints,
              episodesCompleted: currentEpisode,
              completionPercentage: Math.round((currentEpisode / totalEpisodes) * 100),
              isFullyCompleted: currentEpisode >= totalEpisodes,
              questionStats: questionStats,  // âœ… Ensure this exists
              totalAttempts: Object.values(questionStats).reduce((sum, q) => sum + q.attempts, 0),
              correctAttempts: Object.values(questionStats).filter(q => q.finalAttempt).length,
              accuracy: calculatedAccuracy  // âœ… Make sure this is passed
            },
            solvedWords,
            totalHints
          );
        console.log('✅ Analytics logged with accuracy:', calculatedAccuracy);
      } catch (error) {
        console.error('Failed to log analytics:', error);
      }
    };

    logAnalytics();
  }, [sessionId, solvedWords.length, totalHints, timeSpent, currentEpisode, totalEpisodes, questionStats, calculatedAccuracy]);

  const getWordEmoji = (word) => {
    if (!word) return '⭐';
    
    const lowerWord = word.toLowerCase();
    const emojiMap = {
      'brave': '🦸', 'forest': '🌳', 'treasure': '💎', 'adventure': '🗺️',
      'explore': '🔍', 'discover': '💡', 'magic': '✨', 'hero': '🦸‍♂️',
      'dragon': '🐉', 'castle': '🏰', 'sword': '⚔️', 'shield': '🛡️',
      'crown': '👑', 'star': '⭐', 'moon': '🌙', 'sun': '☀️',
      'rainbow': '🌈', 'fire': '🔥', 'water': '💧', 'earth': '🌍',
      'wind': '💨', 'lightning': '⚡', 'ice': '❄️', 'mountain': '⛰️',
      'ocean': '🌊', 'desert': '🏜️', 'jungle': '🌴', 'cave': '🕳️',
      'map': '🗺️', 'compass': '🧭', 'telescope': '🔭', 'book': '📚',
      'key': '🔑', 'door': '🚪', 'bridge': '🌉', 'path': '🛤️',
      'mystery': '🔮', 'wisdom': '🦉', 'courage': '💪', 'friendship': '🤝',
      'hope': '🌟', 'dream': '💭', 'imagination': '🎨'
    };
    
    return emojiMap[lowerWord] || '⭐';
  };

  const getWordColor = (word) => {
    if (!word) return '#9c27b0';
    const length = word.length;
    if (length <= 4) return '#e91e63';
    if (length <= 6) return '#9c27b0';
    if (length <= 8) return '#673ab7';
    return '#3f51b5';
  };

  const achievements = useMemo(() => {
    return [
      {
        icon: '📚',
        value: performanceMetrics.wordsCount,
        title: 'Words Mastered',
        color: '#9c27b0',
        gradient: 'linear-gradient(135deg, #9c27b0, #e91e63)'
      },
      {
        icon: '⏱️',
        value: `${Math.floor(timeSpent / 60)}m ${timeSpent % 60}s`,
        title: 'Time Played',
        color: '#1976d2',
        gradient: 'linear-gradient(135deg, #1976d2, #00bcd4)'
      },
      {
        icon: '💡',
        value: totalHints,
        title: 'Hints Used',
        color: '#ff9800',
        gradient: 'linear-gradient(135deg, #ff9800, #ffc107)'
      },
      {
        icon: '✅',
        value: `${performanceMetrics.episodeProgress}%`,
        title: 'Story Progress',
        color: performanceMetrics.episodeProgress >= 80 ? '#4caf50' : '#ff5722',
        gradient: performanceMetrics.episodeProgress >= 80 
          ? 'linear-gradient(135deg, #4caf50, #8bc34a)' 
          : 'linear-gradient(135deg, #ff5722, #ff9800)'
      }
    ];
  }, [performanceMetrics, timeSpent, totalHints]);

  return (
    <div className={styles.summaryContainer}>
      {/* Animated Confetti Background */}
      {showConfetti && (
        <div className={styles.confettiWrapper}>
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className={styles.confettiPiece}
              initial={{ y: -100, x: Math.random() * window.innerWidth, rotate: 0, opacity: 1 }}
              animate={{ 
                y: window.innerHeight + 100, 
                rotate: 360,
                opacity: 0
              }}
              transition={{ 
                duration: 3 + Math.random() * 2,
                delay: Math.random() * 2,
                ease: "linear"
              }}
              style={{
                backgroundColor: ['#9c27b0', '#e91e63', '#00bcd4', '#ffc107', '#4caf50'][i % 5],
                left: `${Math.random() * 100}%`
              }}
            />
          ))}
        </div>
      )}

      {/* Celebration Header */}
      <motion.div 
        className={styles.celebrationHeader}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        <motion.div 
          className={styles.trophyIcon}
          animate={{ 
            rotate: [0, -10, 10, -10, 10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "easeInOut"  // ✅ FIXED: Added ease for smooth animation
          }}
        >
          🏆
        </motion.div>
        
        <motion.h1 
          className={styles.celebrationTitle}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {isStoryMode ? "Episode Complete!" : "Mission Accomplished!"}
        </motion.h1>
        
        <motion.p 
          className={styles.celebrationSubtitle}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Amazing work! You're becoming a word master! 🌟
        </motion.p>
        
        {/* Episode Progress Bar */}
        <motion.div 
          className={styles.episodeProgressContainer}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className={styles.episodeProgressLabel}>
            <span>📖 Story Progress</span>
            <span className={styles.episodeCount}>
              Episode {currentEpisode} of {totalEpisodes}
            </span>
          </div>
          <div className={styles.progressBarContainer}>
            <motion.div 
              className={styles.progressBarFill}
              initial={{ width: 0 }}
              animate={{ width: `${performanceMetrics.episodeProgress}%` }}
              transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
            >
              <span className={styles.progressPercentage}>
                {performanceMetrics.episodeProgress}%
              </span>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      {/* Performance Dashboard */}
      <motion.div 
        className={styles.performanceSection}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <h2 className={styles.sectionTitle}>📊 Your Amazing Stats</h2>
        
        <div className={styles.achievementsGrid}>
          {achievements.map((achievement, index) => (
            <motion.div
              key={index}
              className={styles.achievementBadge}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                delay: 0.7 + (index * 0.1),
                type: "spring",
                stiffness: 200
              }}
              whileHover={{ 
                scale: 1.05,
                transition: { duration: 0.2 }  // ✅ FIXED: Simplified hover animation
              }}
              style={{ 
                background: achievement.gradient,
                border: 'none'
              }}
            >
              <div className={styles.achievementIcon}>
                {achievement.icon}
              </div>
              <div className={styles.achievementValue} style={{ color: 'white' }}>
                {achievement.value}
              </div>
              <div className={styles.achievementTitle} style={{ color: 'rgba(255,255,255,0.9)' }}>
                {achievement.title}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Vocabulary Showcase */}
      <motion.div 
        className={styles.superWordsSection}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            ✨ Your New Super Words!
          </h2>
          <motion.button 
            className={styles.toggleDetailsBtn}
            onClick={() => setShowDetails(!showDetails)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {showDetails ? '📝 Hide Details' : '📖 Show Definitions'}
          </motion.button>
        </div>

        <div className={styles.wordsGrid}>
          {solvedWords.map((wordData, index) => {
            const word = typeof wordData === 'string' ? wordData : wordData.word;
            const definition = wordData.definition || "A valuable word you've learned!";
            const isSelected = selectedWord === word;
            
            return (
              <motion.div
                key={index}
                className={`${styles.wordCard} ${isSelected ? styles.selectedCard : ''}`}
                initial={{ scale: 0, y: 50, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{ 
                  delay: 0.9 + (index * 0.1),
                  type: "spring"
                }}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 15px 30px rgba(0,0,0,0.2)",
                  transition: { duration: 0.2 }  // ✅ FIXED: Simplified hover
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedWord(isSelected ? null : word)}
                style={{
                  background: isSelected 
                    ? `linear-gradient(135deg, ${getWordColor(word)}, ${getWordColor(word)}dd)`
                    : 'linear-gradient(135deg, #ffffff, #f8f9fa)',
                  border: isSelected ? 'none' : '2px solid #e0e0e0',
                  cursor: 'pointer'
                }}
              >
                <motion.div 
                  className={styles.wordEmoji}
                  animate={{ 
                    scale: isSelected ? 1.2 : 1
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {getWordEmoji(word)}
                </motion.div>
                
                <motion.div 
                  className={styles.wordText}
                  style={{ 
                    color: isSelected ? 'white' : getWordColor(word),
                    fontWeight: 700,
                    fontSize: '1.3rem',
                    textTransform: 'capitalize',
                    letterSpacing: '0.5px'
                  }}
                  animate={{ 
                    scale: isSelected ? 1.1 : 1
                  }}
                >
                  {word || '???'}
                </motion.div>
                
                <AnimatePresence>
                  {(showDetails || isSelected) && (
                    <motion.div 
                      className={styles.wordDefinition}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{
                        color: isSelected ? 'rgba(255,255,255,0.95)' : '#666',
                        marginTop: '10px',
                        fontSize: '0.9rem',
                        lineHeight: '1.4',
                        textAlign: 'center'
                      }}
                    >
                      {definition}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <motion.div 
                  className={styles.wordLength}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: isSelected ? 'rgba(255,255,255,0.3)' : getWordColor(word),
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}
                >
                  {word?.length || 0} letters
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {solvedWords.length === 0 && (
          <motion.div 
            className={styles.emptyState}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              textAlign: 'center',
              padding: '40px',
              color: '#999',
              fontSize: '1.1rem'
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📚</div>
            No words solved yet. Keep playing to learn new words!
          </motion.div>
        )}
      </motion.div>

      {/* ✅ FIXED: Action Buttons - NOW IN ONE LINE */}
      <motion.div 
        className={styles.actionButtonsContainer}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        {hasNextEpisode && (
          <motion.button 
            className={styles.continueButton}
            onClick={onPlayAgain}
            whileHover={{ scale: 1.03, boxShadow: "0 10px 30px rgba(76, 175, 80, 0.4)" }}
            whileTap={{ scale: 0.97 }}
          >
            <span style={{ fontSize: '1.5rem' }}>▶️</span>
            Continue Story
          </motion.button>
        )}
        
        <motion.button 
          className={styles.menuButton}
          onClick={onReturnToMenu}
          whileHover={{ scale: 1.03, boxShadow: "0 10px 30px rgba(156, 39, 176, 0.4)" }}
          whileTap={{ scale: 0.97 }}
        >
          <span style={{ fontSize: '1.5rem' }}>🏠</span>
          Return to Menu
        </motion.button>
      </motion.div>
    </div>
  );
};

export default SummaryScreen;