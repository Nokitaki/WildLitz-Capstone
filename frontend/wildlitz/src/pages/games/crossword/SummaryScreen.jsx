
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
              questionStats: questionStats,  
              totalAttempts: Object.values(questionStats).reduce((sum, q) => sum + q.attempts, 0),
              correctAttempts: Object.values(questionStats).filter(q => q.finalAttempt).length,
              accuracy: calculatedAccuracy  
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
  return '⭐';
};

  const getWordColor = (word) => {
  if (!word) return '#9c27b0';
  
 
  const length = word.length;
  if (length <= 3) return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'; // Purple
  if (length <= 5) return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'; // Pink
  if (length <= 7) return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'; // Blue
  return 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'; // Green
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
        value: totalHints || 0,
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
  
  <div className={styles.achievementsGrid}>
  {achievements.map((achievement, index) => (
    <motion.div
      key={index}
      className={styles.achievementCard}
      style={{ borderLeft: `5px solid ${achievement.color}` }}
    >
      <div className={styles.achievementIcon}>{achievement.icon}</div>
      <div className={styles.achievementValue}>{achievement.value}</div>
      <div className={styles.achievementTitle}>{achievement.title}</div>
    </motion.div>
  ))}
</div>

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
            ease: "easeInOut"  
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
                transition: { duration: 0.2 }  
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
            whileHover={{ scale: 1.05, boxShadow: "0 8px 20px rgba(147, 51, 234, 0.4)" }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: showDetails 
                ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                : 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)',
              transition: 'all 0.3s ease'
            }}
          >
            {showDetails ? '⭐ Hide Details' : '⭐ Show Definitions'}
          </motion.button>
        </div>

      <div className={styles.wordsGrid}>
  {solvedWords.map((wordData, index) => {
    const word = typeof wordData === 'string' ? wordData : wordData.word;
    const definition = (wordData && typeof wordData === 'object' && wordData.definition) 
      ? wordData.definition 
      : "A valuable word you've learned!";
    const isSelected = selectedWord === word;
    
    return (
      <motion.div
        key={index}
        className={`${styles.wordCard} ${isSelected ? styles.selectedCard : ''}`}
        initial={{ scale: 0, y: 50, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ 
          delay: 0.9 + (index * 0.1),
          type: "spring",
          stiffness: 100
        }}
        whileHover={{ 
          scale: 1.08,
          boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
          transition: { duration: 0.2 }
        }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setSelectedWord(isSelected ? null : word)}
        style={{
          background: isSelected 
            ? getWordColor(word)
            : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          border: isSelected ? 'none' : '3px solid rgba(102, 126, 234, 0.2)',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* ✅ Animated background shine effect */}
        <motion.div
          style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent)',
            pointerEvents: 'none'
          }}
          animate={{
            rotate: isSelected ? 360 : 0,
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Star emoji */}
        <motion.div 
          className={styles.wordEmoji}
          animate={{ 
            scale: isSelected ? [1, 1.3, 1] : 1,
            rotate: isSelected ? [0, 360] : 0
          }}
          transition={{ 
            duration: 0.6,
            repeat: isSelected ? Infinity : 0,
            repeatDelay: 1
          }}
          style={{
            fontSize: '4rem',
            filter: 'drop-shadow(0 4px 12px rgba(255, 215, 0, 0.5))',
            marginBottom: '15px'
          }}
        >
          ⭐
        </motion.div>
        
        {/* Word text */}
        <motion.div 
          className={styles.wordText}
          style={{ 
            color: isSelected ? 'white' : '#2d3748',
            fontWeight: 800,
            fontSize: '1.6rem',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            textShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
            marginBottom: '8px'
          }}
          animate={{ 
            scale: isSelected ? 1.1 : 1
          }}
        >
          {word || '???'}
        </motion.div>
        
        {/* Letter count badge */}
        <motion.div 
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: isSelected ? 'rgba(255,255,255,0.25)' : 'rgba(102, 126, 234, 0.15)',
            backdropFilter: 'blur(10px)',
            color: isSelected ? 'white' : '#667eea',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            border: isSelected ? '2px solid rgba(255,255,255,0.3)' : '2px solid rgba(102, 126, 234, 0.3)'
          }}
        >
          {word?.length || 0} letters
        </motion.div>
        
        {/* Definition */}
        <AnimatePresence>
          {(showDetails || isSelected) && definition && (
            <motion.div 
              className={styles.wordDefinition}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                color: isSelected ? 'rgba(255,255,255,0.95)' : '#64748b',
                marginTop: '15px',
                paddingTop: '15px',
                borderTop: isSelected ? '2px solid rgba(255,255,255,0.2)' : '2px solid rgba(0,0,0,0.1)',
                fontSize: '0.95rem',
                lineHeight: '1.6',
                textAlign: 'center',
                fontWeight: isSelected ? 500 : 400
              }}
            >
              {definition}
            </motion.div>
          )}
        </AnimatePresence>
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