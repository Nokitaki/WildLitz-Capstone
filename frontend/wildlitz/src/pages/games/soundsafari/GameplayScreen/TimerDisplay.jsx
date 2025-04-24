// components/SoundSafari/GameplayScreen/TimerDisplay.jsx

import React from 'react';
import { motion } from 'framer-motion';
import styles from '../../../../styles/games/safari/SoundSafari.module.css';

/**
 * Component for displaying the timer during gameplay
 */
const TimerDisplay = ({ timeRemaining, timeLimit }) => {
  if (!timeLimit || timeLimit <= 0) return null;
  
  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  return (
    <div className={styles.timerContainer}>
      <div className={styles.timerLabel}>
        Time: <span className={timeRemaining < 10 ? styles.timerWarning : ''}>{formatTime(timeRemaining)}</span>
      </div>
      <div className={styles.timerBarContainer}>
        <motion.div 
          className={styles.timerBar}
          initial={{ width: '100%' }}
          animate={{ 
            width: `${(timeRemaining / timeLimit) * 100}%`,
            backgroundColor: timeRemaining < 10 ? '#f44336' : '#4caf50'
          }}
          transition={{ duration: 0.5 }}
        ></motion.div>
      </div>
    </div>
  );
};

export default TimerDisplay;