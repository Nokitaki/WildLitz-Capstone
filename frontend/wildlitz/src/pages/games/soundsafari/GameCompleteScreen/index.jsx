// components/SoundSafari/GameCompleteScreen/index.jsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from '../../../../styles/games/safari/SoundSafari.module.css';
import { playCelebrationSound } from '../../../../utils/soundUtils';

/**
 * Component for the game completion screen
 */
const GameCompleteScreen = ({ 
  score,
  totalRounds,
  onPlayAgain,
  onChangeDifficulty
}) => {
  // Calculate final score as percentage
  const finalScore = Math.round(score / totalRounds);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Determine achievement level based on score
  const getAchievement = () => {
    if (finalScore >= 90) return { title: "Safari Master", emoji: "🏆", color: "#ffd700" };
    if (finalScore >= 75) return { title: "Sound Explorer", emoji: "🌟", color: "#c0ca33" };
    if (finalScore >= 60) return { title: "Animal Tracker", emoji: "🔍", color: "#29b6f6" };
    return { title: "Safari Beginner", emoji: "🌱", color: "#66bb6a" };
  };
  
  const achievement = getAchievement();
  
  // Play celebration effects
  useEffect(() => {
    // Show confetti for good scores
    if (finalScore >= 70) {
      setShowConfetti(true);
      
      // Play victory sound with slight delay
      setTimeout(() => playCelebrationSound(finalScore), 500);
    }
  }, [finalScore]);
  
  // Get feedback message based on score
  const getFeedbackMessage = () => {
    if (finalScore >= 90) return "Amazing job! You're a true Sound Safari expert!";
    if (finalScore >= 75) return "Great work! You've got a good ear for sounds!";
    if (finalScore >= 60) return "Good job! Keep practicing to improve your skills!";
    return "Nice try! With more practice, you'll be a sound expert!";
  };
  
  // Get tip based on score
  const getTip = () => {
    if (finalScore >= 90) return "Challenge yourself with higher difficulty levels!";
    if (finalScore >= 75) return "Try a harder difficulty to test your skills!";
    if (finalScore >= 60) return "Keep practicing to recognize sounds faster!";
    return "Listen carefully to the sounds and practice with different words!";
  };
  
  return (
    <div className={styles.card}>
      {showConfetti && (
        <div className={styles.confettiContainer}>
          {Array.from({ length: 100 }).map((_, i) => (
            <motion.div
              key={i}
              className={styles.confettiPiece}
              style={{
                backgroundColor: `hsl(${Math.random() * 360}, 80%, 60%)`,
                width: `${Math.random() * 15 + 5}px`,
                height: `${Math.random() * 8 + 5}px`,
                borderRadius: Math.random() > 0.5 ? '50%' : '3px',
                top: `-50px`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [`0vh`, `100vh`],
                x: [0, Math.random() * 200 - 100],
                rotate: [0, Math.random() * 360 * (Math.random() > 0.5 ? 1 : -1)],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                ease: "linear",
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      )}
      
      <div className={styles.cardHeader}>
        <motion.h2 
          className={styles.cardTitle}
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, type: 'spring' }}
        >
          <span role="img" aria-label="Complete" className={styles.headerEmoji}>🎉</span>
          Safari Complete!
        </motion.h2>
      </div>
      
      <motion.div 
        className={styles.trophyContainer}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.8, delay: 0.3, type: 'spring' }}
      >
        {/* Trophy icon with achievement level */}
        <motion.div 
          className={styles.trophyIcon} 
          style={{ backgroundColor: achievement.color }}
          animate={{ rotate: [-5, 5, -5, 5, 0] }}
          transition={{ 
            duration: 1,
            times: [0, 0.25, 0.5, 0.75, 1],
            ease: "easeInOut",
            delay: 1
          }}
        >
          <span>{achievement.emoji}</span>
        </motion.div>
        <div className={styles.achievementTitle} style={{ color: achievement.color }}>
          {achievement.title}
        </div>
      </motion.div>
      
      <motion.div 
        className={styles.finalScoreContainer}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className={styles.scoreCircle}>
          <svg viewBox="0 0 100 100" className={styles.scoreCircleSvg}>
            <circle 
              cx="50" cy="50" r="45" 
              fill="none" 
              stroke="#e0e0e0" 
              strokeWidth="8"
            />
            <motion.circle 
              cx="50" cy="50" r="45" 
              fill="none" 
              stroke={finalScore >= 70 ? "#4caf50" : finalScore >= 50 ? "#ff9800" : "#f44336"} 
              strokeWidth="8"
              strokeDasharray="283"
              strokeDashoffset="283"
              initial={{ strokeDashoffset: 283 }}
              animate={{ strokeDashoffset: 283 - (283 * finalScore / 100) }}
              transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }}
              style={{ transformOrigin: "center", transform: "rotate(-90deg)" }}
            />
          </svg>
          <div className={styles.scoreValue}>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3 }}
            >
              {finalScore}%
            </motion.span>
          </div>
        </div>
      </motion.div>
      
      <motion.div 
        className={styles.feedbackMessage}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <p>{getFeedbackMessage()}</p>
      </motion.div>
      
      <motion.div 
        className={styles.tipContainer}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8 }}
      >
        <div className={styles.tipHeader}>
          <span role="img" aria-label="Tip" className={styles.tipIcon}>💡</span>
          <h3>Pro Tip:</h3>
        </div>
        <p>{getTip()}</p>
      </motion.div>
      
      <motion.div 
        className={styles.actionButtons}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
      >
        <motion.button 
          className={styles.playAgainButton}
          whileHover={{ scale: 1.05, boxShadow: "0 8px 16px rgba(0,0,0,0.2)" }}
          whileTap={{ scale: 0.95 }}
          onClick={onPlayAgain}
        >
          <span role="img" aria-label="Play Again" className={styles.buttonIcon}>🔄</span>
          Play Again
        </motion.button>
        
        <motion.button 
          className={styles.changeDifficultyButton}
          whileHover={{ scale: 1.05, boxShadow: "0 8px 16px rgba(0,0,0,0.2)" }}
          whileTap={{ scale: 0.95 }}
          onClick={onChangeDifficulty}
        >
          <span role="img" aria-label="Difficulty" className={styles.buttonIcon}>⚙️</span>
          Change Difficulty
        </motion.button>
      </motion.div>
    </div>
  );
};

export default GameCompleteScreen;