import React from 'react';
import { motion } from 'framer-motion';
import styles from '../../styles/SoundSafariGame.module.css';

const SoundSafariLoadingScreen = ({ targetSound, difficulty, onContinue }) => {
  return (
    <div className={styles.container}>
      <div className={styles.loadingContent}>
        <div className={styles.loadingCard}>
          <div className={styles.header}>
            <h1>WildLitz - Sound Safari Game</h1>
            <div className={styles.progressContainer}>
              <div className={styles.progressBar} style={{ width: '40%' }}></div>
              <span className={styles.progressText}>2/5</span>
            </div>
          </div>
          
          <div className={styles.aiBadge}>
            <span role="img" aria-label="AI">🤖</span> AI Assisted Word Selection
          </div>
          
          <h2 className={styles.loadingTitle}>Preparing Sound Safari...</h2>
          
          <div className={styles.loadingDots}>
            <motion.div 
              className={styles.dot}
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0 }}
            />
            <motion.div 
              className={styles.dot}
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
            />
            <motion.div 
              className={styles.dot}
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
            />
          </div>
          
          <div className={styles.targetSoundContainer}>
            <h3>Your Target Sound:</h3>
            <div className={styles.targetSoundDisplay}>
              <span className={styles.targetSound}>{targetSound || "sh"}</span>
              <p>Listen for this sound in the words!</p>
            </div>
          </div>
          
          <div className={`${styles.infoBox} ${styles.difficulty}`}>
            <p>Difficulty Level: {difficulty || "Medium"}</p>
          </div>
          
          <div className={`${styles.infoBox} ${styles.instructions}`}>
            <p>Choose words that contain the target sound.</p>
          </div>
          
          <motion.button 
            className={styles.readyButton}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onContinue}
          >
            Start Sound Hunt!
          </motion.button>
          
          <div className={styles.hintBox}>
            <span role="img" aria-label="Hint">💡</span> Hint: Listen carefully to each word
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoundSafariLoadingScreen;