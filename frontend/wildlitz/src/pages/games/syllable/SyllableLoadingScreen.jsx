// src/pages/games/syllable/SyllableLoadingScreen.jsx
import React from 'react';
import { motion } from 'framer-motion';
import styles from '../../../styles/games/syllable/SyllableLoadingScreen.module.css';

const SyllableLoadingScreen = ({ difficulty, wordIndex = 0, totalWords = 10, tip = "" }) => {
  // Get color theme based on difficulty
  const getDifficultyColor = (level) => {
    switch(level.toLowerCase()) {
      case 'easy': return '#4caf50'; // Green
      case 'medium': return '#ff9800'; // Orange
      case 'hard': return '#f44336'; // Red
      case 'custom': return '#9c27b0'; // Purple
      default: return '#2196f3'; // Blue
    }
  };

  const dotVariants = {
    jump: {
      y: -15,
      transition: {
        duration: 0.6,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut",
      },
    },
  };

  return (
    <div className={styles.loadingScreenContainer}>
      <div className={styles.loadingContent}>
        <div className={styles.loadingCard}>
          <div className={styles.gameHeader}>
            <h1>WildLitz - Syllable Clapping Game</h1>
            <div className={styles.progressContainer}>
              <div className={styles.loadingBarContainer}>
                <motion.div 
                  className={styles.loadingBar}
                  animate={{
                    width: ['0%', '100%'],
                    x: ['-5%', '5%']
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    ease: 'easeInOut'
                  }}
                  style={{ backgroundColor: getDifficultyColor(difficulty) }}
                />
              </div>
            </div>
          </div>
          
          <div className={styles.aiBadge}>
            <span role="img" aria-label="AI">🤖</span> AI Assisted Learning
          </div>
          
          <h2 className={styles.loadingTitle}>Preparing Game...</h2>
          
          <motion.div 
            className={styles.loadingDotsContainer}
            animate="jump"
            transition={{ staggerChildren: 0.2 }}
          >
            <motion.div 
              className={styles.loadingDot}
              variants={dotVariants}
              style={{ backgroundColor: getDifficultyColor(difficulty) }}
            />
            <motion.div 
              className={styles.loadingDot}
              variants={dotVariants}
              style={{ backgroundColor: getDifficultyColor(difficulty) }}
            />
            <motion.div 
              className={styles.loadingDot}
              variants={dotVariants}
              style={{ backgroundColor: getDifficultyColor(difficulty) }}
            />
          </motion.div>
          
          <div className={styles.infoBox}>
            <p><strong>Difficulty Level:</strong> {difficulty}</p>
          </div>
          
          {tip && (
            <div className={styles.tipsBox}>
              <span role="img" aria-label="Tip">💡</span> <strong>Tip:</strong> {tip}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SyllableLoadingScreen;