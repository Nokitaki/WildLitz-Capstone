// src/pages/games/soundsafari/GameCompleteScreen.jsx <created on 2025-01-03>

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import styles from '../../../styles/games/safari/GameCompleteScreen.module.css';
import WildLitzFox from '../../../assets/img/wildlitz-idle.png';
import soundSafariAnalyticsService from '../../../services/soundSafariAnalyticsService';

/**
 * Game Complete Screen - Shown after all rounds are complete
 * WITH ANALYTICS INTEGRATION
 */
const GameCompleteScreen = ({ 
  score, 
  totalRounds, 
  onPlayAgain, 
  onChangeDifficulty,
  // NEW: Optional props for analytics
  gameConfig = null,
  totalAnimals = 0,
  totalCorrect = 0
}) => {
  const navigate = useNavigate();
  
  // Save analytics when component mounts
  useEffect(() => {
    saveGameAnalytics();
  }, []);

  const saveGameAnalytics = async () => {
    try {
      // Only save if we have the necessary data
      if (!gameConfig) {
        console.log('No game config provided, skipping analytics');
        return;
      }

      const token = localStorage.getItem('access_token');
      
      if (!token) {
        console.log('User not logged in, skipping analytics save');
        return;
      }

      // Calculate game statistics
      const totalIncorrect = totalAnimals - totalCorrect;
      const successRate = totalAnimals > 0 ? ((totalCorrect / totalAnimals) * 100) : 0;

      // Format session data
      const sessionData = soundSafariAnalyticsService.formatSessionData(
        {
          totalAnimals: totalAnimals,
          correctSelections: totalCorrect,
          incorrectSelections: totalIncorrect,
          successRate: successRate,
          timeSpent: 0, // Can be tracked if needed
          completed: true
        },
        {
          targetSound: gameConfig.targetSound || 's',
          soundPosition: gameConfig.soundPosition || 'beginning',
          environment: gameConfig.environment || 'jungle',
          difficulty: gameConfig.difficulty || 'easy'
        }
      );

      // Save to database
      const result = await soundSafariAnalyticsService.saveGameSession(sessionData);
      
      if (result.success) {
        console.log('✅ Sound Safari analytics saved successfully!');
      } else {
        console.warn('⚠️ Failed to save Sound Safari analytics:', result.error);
      }
    } catch (error) {
      console.error('❌ Error saving Sound Safari analytics:', error);
    }
  };

  // Calculate final percentage
  const finalPercentage = Math.round((score / totalRounds) * 100);
  
  // Get feedback message based on score
  const getFeedbackMessage = () => {
    if (finalPercentage >= 90) return {
      title: "🏆 Outstanding Safari Explorer!",
      message: "You have excellent phonemic awareness! You're a true sound detective!",
      color: "#4CAF50"
    };
    if (finalPercentage >= 70) return {
      title: "🌟 Great Safari Guide!",
      message: "You're doing wonderfully! Your listening skills are improving!",
      color: "#8BC34A"
    };
    if (finalPercentage >= 50) return {
      title: "👍 Good Safari Tracker!",
      message: "Nice effort! Keep practicing and you'll become even better!",
      color: "#FFC107"
    };
    return {
      title: "🌱 Safari Adventurer!",
      message: "Every adventure helps you learn! Keep exploring sounds!",
      color: "#FF9800"
    };
  };

  const feedback = getFeedbackMessage();

  // Confetti animation for high scores
  const showConfetti = finalPercentage >= 70;

  return (
    <div className={styles.completeContainer}>
      {showConfetti && (
        <div className={styles.confettiContainer}>
          {Array.from({ length: 40 }).map((_, i) => (
            <motion.div
              key={i}
              className={styles.confettiPiece}
              style={{
                backgroundColor: `hsl(${Math.random() * 360}, 80%, 60%)`,
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                top: `-50px`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                y: ['0vh', '120vh'],
                x: [0, Math.random() * 100 - 50],
                rotate: [0, Math.random() * 720 * (Math.random() > 0.5 ? 1 : -1)],
                opacity: [1, 0.8, 0],
              }}
              transition={{
                duration: Math.random() * 3 + 3,
                ease: "easeOut",
                delay: Math.random() * 0.5,
              }}
            />
          ))}
        </div>
      )}

      <motion.div 
        className={styles.completeCard}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        {/* Header */}
        <div className={styles.completeHeader}>
          <h1 className={styles.completeTitle}>Safari Adventure Complete!</h1>
        </div>

        {/* Mascot */}
        <motion.div 
          className={styles.mascotContainer}
          initial={{ y: -20 }}
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <img src={WildLitzFox} alt="WildLitz Fox" className={styles.mascotImage} />
        </motion.div>

        {/* Feedback Message */}
        <div className={styles.feedbackSection} style={{ borderColor: feedback.color }}>
          <h2 className={styles.feedbackTitle} style={{ color: feedback.color }}>
            {feedback.title}
          </h2>
          <p className={styles.feedbackMessage}>{feedback.message}</p>
        </div>

        {/* Final Score */}
        <div className={styles.scoreSection}>
          <div className={styles.scoreBanner} style={{ background: `linear-gradient(135deg, ${feedback.color}, ${feedback.color}dd)` }}>
            <div className={styles.scoreLabel}>Final Score</div>
            <div className={styles.scoreLarge}>{finalPercentage}%</div>
            <div className={styles.scoreDetails}>
              {score.toFixed(1)} out of {totalRounds} rounds
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🎯</div>
            <div className={styles.statValue}>{totalRounds}</div>
            <div className={styles.statLabel}>Rounds Played</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🦁</div>
            <div className={styles.statValue}>{totalCorrect || 0}</div>
            <div className={styles.statLabel}>Animals Found</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>✨</div>
            <div className={styles.statValue}>{finalPercentage}%</div>
            <div className={styles.statLabel}>Accuracy</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          <motion.button
            className={styles.playAgainButton}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onPlayAgain}
          >
            <span className={styles.buttonIcon}>🔄</span>
            Play Again
          </motion.button>
          
          <motion.button
            className={styles.changeDifficultyButton}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onChangeDifficulty}
          >
            <span className={styles.buttonIcon}>⚙️</span>
            Change Settings
          </motion.button>
          
          <motion.button
            className={styles.profileButton}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/profile')}
          >
            <span className={styles.buttonIcon}>📊</span>
            View Progress
          </motion.button>
          
          <motion.button
            className={styles.homeButton}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/home')}
          >
            <span className={styles.buttonIcon}>🏠</span>
            Main Menu
          </motion.button>
        </div>

        {/* Encouraging Message */}
        <div className={styles.encouragementBox}>
          <p className={styles.encouragementText}>
            🎉 Great job completing the Sound Safari! Visit your profile to see how you're improving!
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default GameCompleteScreen;





