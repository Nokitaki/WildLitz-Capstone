// frontend/wildlitz/src/pages/games/soundsafari/GameCompleteScreen.jsx
// UPDATED: Analytics already saved in main component, this just displays results

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import styles from '../../../styles/games/safari/GameCompleteScreen.module.css';
import WildLitzFox from '../../../assets/img/wildlitz-idle.png';

/**
 * Game Complete Screen - Shown after all rounds are complete
 * UPDATED: No longer saves analytics (handled by main game component)
 */
const GameCompleteScreen = ({ 
  score, 
  totalRounds, 
  onPlayAgain, 
  onChangeDifficulty,
  gameConfig = null
}) => {
  const navigate = useNavigate();
  
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
      message: "You're doing really well at identifying sounds! Keep practicing!",
      color: "#2196F3"
    };
    if (finalPercentage >= 50) return {
      title: "👍 Good Effort!",
      message: "You're learning! Keep playing to get even better at hearing sounds!",
      color: "#FF9800"
    };
    return {
      title: "🎯 Keep Trying!",
      message: "Learning takes practice! Try the easier level and you'll improve!",
      color: "#F44336"
    };
  };
  
  const feedback = getFeedbackMessage();
  
  return (
    <motion.div
      className={styles.completeContainer}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.5 }}
    >
      <div className={styles.completeCard}>
        {/* Character */}
        <motion.div
          className={styles.character}
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <img src={WildLitzFox} alt="WildLitz Fox" />
        </motion.div>
        
        {/* Title */}
        <motion.div
          className={styles.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2>Safari Complete!</h2>
          <p className={styles.subtitle}>You finished all {totalRounds} rounds!</p>
        </motion.div>
        
        {/* Score Display */}
        <motion.div
          className={styles.scoreDisplay}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
        >
          <div className={styles.scoreCircle} style={{ borderColor: feedback.color }}>
            <div className={styles.scoreValue} style={{ color: feedback.color }}>
              {Math.round(score)}
            </div>
            <div className={styles.scoreLabel}>out of {totalRounds * 100}</div>
          </div>
        </motion.div>
        
        {/* Feedback Message */}
        <motion.div
          className={styles.feedback}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          style={{ backgroundColor: `${feedback.color}20` }}
        >
          <h3 style={{ color: feedback.color }}>{feedback.title}</h3>
          <p>{feedback.message}</p>
        </motion.div>
        
        {/* Stats Summary */}
        <motion.div
          className={styles.statsGrid}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🎯</div>
            <div className={styles.statLabel}>Accuracy</div>
            <div className={styles.statValue}>{finalPercentage}%</div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🔊</div>
            <div className={styles.statLabel}>Sound</div>
            <div className={styles.statValue}>
              {gameConfig?.targetSound?.toUpperCase() || '-'}
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📍</div>
            <div className={styles.statLabel}>Position</div>
            <div className={styles.statValue}>
              {gameConfig?.soundPosition?.charAt(0).toUpperCase() + 
               gameConfig?.soundPosition?.slice(1) || '-'}
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>⭐</div>
            <div className={styles.statLabel}>Difficulty</div>
            <div className={styles.statValue}>
              {gameConfig?.difficulty?.charAt(0).toUpperCase() + 
               gameConfig?.difficulty?.slice(1) || '-'}
            </div>
          </div>
        </motion.div>
        
        {/* Action Buttons */}
        <motion.div
          className={styles.actions}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <button
            className={styles.playAgainBtn}
            onClick={onPlayAgain}
          >
            🔄 Play Again
          </button>
          
          <button
            className={styles.changeDifficultyBtn}
            onClick={onChangeDifficulty}
          >
            ⚙️ Change Settings
          </button>
          
          <button
            className={styles.viewAnalyticsBtn}
            onClick={() => navigate('/games/sound-safari/analytics')}
          >
            📊 View Progress
          </button>
        </motion.div>
        
        {/* Confetti effect for high scores */}
        {finalPercentage >= 90 && (
          <div className={styles.confetti}>
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className={styles.confettiPiece}
                initial={{ y: -100, x: Math.random() * window.innerWidth, opacity: 1 }}
                animate={{ 
                  y: window.innerHeight + 100,
                  x: Math.random() * window.innerWidth,
                  opacity: 0,
                  rotate: Math.random() * 720
                }}
                transition={{ 
                  duration: 3 + Math.random() * 2,
                  delay: Math.random() * 0.5
                }}
                style={{
                  backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1'][Math.floor(Math.random() * 4)]
                }}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default GameCompleteScreen;