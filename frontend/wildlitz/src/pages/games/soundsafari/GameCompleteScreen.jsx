// frontend/wildlitz/src/pages/games/soundsafari/GameCompleteScreen.jsx
// UPDATED - Shows overall success rate (like analytics) without points display

import React, { useState, useEffect, useRef} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import styles from '../../../styles/games/safari/GameCompleteScreen.module.css';
import gameCompleteSoundEffect from '../../../assets/sound_effects/game-complete-sound-effect.mp3';
import WildLitzFox from '../../../assets/img/wildlitz-idle.png';

/**
 * Game Complete Screen - Shown after all rounds are complete
 * Displays overall success rate across all rounds
 */
const GameCompleteScreen = ({ 
  score, 
  totalRounds, 
  onPlayAgain, 
  onChangeDifficulty,
  totalCorrect = 0,
  totalAnimalsWithSound = 0,
  gameConfig = null,
  roundsData = null // New prop for detailed round data
}) => {
  // Sound effect reference
  const audioRef = useRef(null);
  
  // Play sound effect when component mounts
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.5; // Set to 50% volume
      
      const playSound = async () => {
        try {
          await audioRef.current.play();
        } catch (error) {
          console.log('Sound effect auto-play blocked:', error);
        }
      };
      
      playSound();
    }
  }, []);
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Calculate overall success rate (like analytics)
  const calculateOverallSuccessRate = () => {
    if (roundsData && roundsData.length > 0) {
      // Calculate from detailed round data if available
      let totalCorrect = 0;
      let totalAnimalsWithSound = 0;
      
      roundsData.forEach(round => {
        // Access the correct property names from your analytics data
        totalCorrect += round.correctCount || 0;
        totalAnimalsWithSound += round.totalCorrectAnimals || 0;
      });
      
      // Avoid division by zero
      if (totalAnimalsWithSound === 0) {
        return 0;
      }
      
      return Math.round((totalCorrect / totalAnimalsWithSound) * 100);
    } else {
      // Fallback: Use props if detailed data not available
      if (totalAnimalsWithSound === 0) {
        return 0;
      }
      return Math.round((totalCorrect / totalAnimalsWithSound) * 100);
    }
  };
  
  // Calculate totals for display
  const calculateTotals = () => {
    if (roundsData && roundsData.length > 0) {
      let totalCorrect = 0;
      let totalAnimalsWithSound = 0;
      
      roundsData.forEach(round => {
        totalCorrect += round.correctCount || 0;
        totalAnimalsWithSound += round.totalCorrectAnimals || 0;
      });
      
      return { totalCorrect, totalAnimalsWithSound };
    } else {
      return { 
        totalCorrect, 
        totalAnimalsWithSound 
      };
    }
  };
  
  const overallSuccessRate = calculateOverallSuccessRate();
  const { totalCorrect: calculatedCorrect, totalAnimalsWithSound: calculatedTotal } = calculateTotals();
  
  // Get feedback message based on success rate
  const getFeedbackMessage = () => {
    if (overallSuccessRate >= 90) return {
      title: "🏆 Outstanding Safari Explorer!",
      message: "You have excellent phonemic awareness! You're a true sound detective!",
      color: "#4caf50",
      emoji: "🏆"
    };
    if (overallSuccessRate >= 70) return {
      title: "🌟 Great Safari Guide!",
      message: "You're doing really well at identifying sounds! Keep practicing!",
      color: "#2196f3",
      emoji: "🌟"
    };
    if (overallSuccessRate >= 50) return {
      title: "👍 Good Effort!",
      message: "You're learning! Keep playing to get even better at hearing sounds!",
      color: "#ff9800",
      emoji: "👍"
    };
    return {
      title: "🎯 Keep Trying!",
      message: "Learning takes practice! Try the easier level and you'll improve!",
      color: "#f44336",
      emoji: "🎯"
    };
  };
  
  const feedback = getFeedbackMessage();

  // Calculate star rating based on success rate (0-5 stars)
  const getStarRating = () => {
    if (overallSuccessRate >= 81) return 5;
    if (overallSuccessRate >= 61) return 4;
    if (overallSuccessRate >= 41) return 3;
    if (overallSuccessRate >= 21) return 2;
    return 1;
  };

const starCount = getStarRating();
  
  // Get achievement badges based on performance
  const getAchievementBadges = () => {
    const badges = [];
    if (overallSuccessRate === 100) badges.push({ icon: "💯", label: "Perfect Score!", color: "#ffd700" });
    if (overallSuccessRate >= 90) badges.push({ icon: "🎯", label: "Expert Listener", color: "#4caf50" });
    if (overallSuccessRate >= 70) badges.push({ icon: "⭐", label: "Sound Master", color: "#2196f3" });
    if (overallSuccessRate >= 50) badges.push({ icon: "🔥", label: "Good Progress", color: "#ff5722" });
    return badges;
  };
  
  const badges = getAchievementBadges();
  
  // Show confetti on mount for good scores
  useEffect(() => {
    if (overallSuccessRate >= 70) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [overallSuccessRate]);
  
  // Handle navigation
  const handleGoHome = () => {
    navigate('/home');
  };
  
  return (
    <div className={styles.completeContainer}>
      {/* Game Complete Sound Effect */}
      <audio ref={audioRef} src={gameCompleteSoundEffect} />
      {/* Confetti Animation */}
      <AnimatePresence>
        {showConfetti && (
          <div className={styles.confettiContainer}>
            {Array.from({ length: 40 }).map((_, i) => (
              <motion.div
                key={i}
                className={styles.confettiPiece}
                style={{
                  backgroundColor: `hsl(${Math.random() * 360}, 80%, 60%)`,
                  width: `${Math.random() * 10 + 6}px`,
                  height: `${Math.random() * 10 + 6}px`,
                  top: `-20px`,
                  left: `${Math.random() * 100}%`,
                }}
                initial={{ y: -20, opacity: 1 }}
                animate={{
                  y: window.innerHeight + 50,
                  x: Math.random() * 100 - 50,
                  rotate: Math.random() * 360 * (Math.random() > 0.5 ? 1 : -1),
                  opacity: 0
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  ease: 'easeOut'
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
      
      {/* Single Scrollable Card */}
      <motion.div 
        className={styles.completeCard}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Character Mascot */}
        <motion.div
          className={styles.character}
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <img src={WildLitzFox} alt="WildLitz Fox" className={styles.characterImage} />
        </motion.div>
        
        {/* Header */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className={styles.title}>
            <span className={styles.titleIcon}>🎯</span>
            Safari Complete!
          </h1>
          <p className={styles.subtitle}>You finished all {totalRounds} rounds!</p>
        </motion.div>
        
        {/* Star Rating Display */}
        <motion.div
          className={styles.starSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className={styles.starsContainer}>
            {[...Array(starCount)].map((_, index) => (
              <motion.span
                key={index}
                className={styles.star}
                style={{ animationDelay: `${index * 0.2}s` }}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  delay: 0.7 + (index * 0.15),
                  type: "spring",
                  stiffness: 200,
                  damping: 10
                }}
              >
                ⭐
              </motion.span>
            ))}
          </div>
          <div className={styles.starLabel}>
            ✅ {calculatedCorrect} correct
          </div>
        </motion.div>
        
        {/* Feedback Message */}
        <motion.div
          className={styles.feedbackSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className={styles.feedbackBox} style={{ borderLeftColor: feedback.color }}>
            <h2 className={styles.feedbackTitle} style={{ color: feedback.color }}>
              {feedback.emoji} {feedback.title}
            </h2>
            <p className={styles.feedbackMessage}>{feedback.message}</p>
          </div>
        </motion.div>
        
        {/* Achievement Badges */}
        {badges.length > 0 && (
          <motion.div
            className={styles.badgesSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <h3 className={styles.sectionTitle}>🎖️ Achievements Earned</h3>
            <div className={styles.badgesGrid}>
              {badges.map((badge, index) => (
                <motion.div
                  key={index}
                  className={styles.badge}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    delay: 1 + index * 0.1, 
                    type: "spring", 
                    stiffness: 200 
                  }}
                >
                  <div className={styles.badgeIcon}>{badge.icon}</div>
                  <div className={styles.badgeLabel}>{badge.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
        
        {/* Game Statistics */}
        <motion.div
          className={styles.statsSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          <h3 className={styles.sectionTitle}>📊 Game Statistics</h3>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>🎯</div>
              <div className={styles.statValue}>{overallSuccessRate}%</div>
              <div className={styles.statLabel}>Accuracy</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>📊</div>
              <div className={styles.statValue}>{gameConfig?.targetSound?.toUpperCase() || '—'}</div>
              <div className={styles.statLabel}>Sound</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>📍</div>
              <div className={styles.statValue}>
                {gameConfig?.soundPosition === 'beginning' ? 'Start' : 
                 gameConfig?.soundPosition === 'middle' ? 'Middle' : 
                 gameConfig?.soundPosition === 'ending' ? 'End' : 'Any'}
              </div>
              <div className={styles.statLabel}>Position</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>⭐</div>
              <div className={styles.statValue}>
                {gameConfig?.difficulty === 'easy' ? 'Easy' :
                 gameConfig?.difficulty === 'medium' ? 'Medium' : 'Hard'}
              </div>
              <div className={styles.statLabel}>Difficulty</div>
            </div>
          </div>
        </motion.div>
        
        {/* Action Buttons */}
        <motion.div
          className={styles.actionButtons}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
        >
          <motion.button
            className={styles.playAgainButton}
            onClick={onPlayAgain}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>🔄</span>
            Play Again
          </motion.button>
          <motion.button
            className={styles.changeDifficultyButton}
            onClick={onChangeDifficulty}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>⚙️</span>
            Change Settings
          </motion.button>
          <motion.button
            className={styles.homeButton}
            onClick={handleGoHome}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>🏠</span>
            Go Home
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default GameCompleteScreen;