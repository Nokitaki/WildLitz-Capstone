import React from 'react';
import { motion } from 'framer-motion';
import styles from '../../../styles/SoundSafariLoading.module.css';

/**
 * Loading screen component for Sound Safari game
 * Displayed between rounds to introduce the target sound and prepare the player
 */
const SoundSafariLoadingScreen = ({ 
  targetSound, 
  difficulty = 'Medium', 
  onContinue,
  round = 1,
  totalRounds = 5
}) => {
  // Examples for each sound to display during loading
  const soundExamples = {
    's': 'snake, sun, seal, spider', 
    'm': 'monkey, mouse, map, moon',
    't': 'tiger, turtle, table, tree',
    'b': 'bear, ball, boat, bee',
    'p': 'penguin, pig, pan, pear',
    'f': 'fox, fish, frog, flower',
    'l': 'lion, leaf, log, lamp',
    'z': 'zebra, zoo, zigzag, zero',
    'g': 'goat, giraffe, gift, game',
    'w': 'wolf, whale, water, web',
    'd': 'dog, dolphin, desk, door',
    'c': 'cat, cow, car, cake',
    'r': 'rabbit, rat, rain, rose',
    'h': 'horse, hat, hand, house'
  };

  // Get examples for this sound, or show generic message
  const examples = soundExamples[targetSound.toLowerCase()] || 
    'words containing this sound';

  return (
    <div className={styles.container}>
      <div className={styles.loadingContent}>
        <div className={styles.loadingCard}>
          <div className={styles.header}>
            <h1>WildLitz - Sound Safari Game</h1>
            <div className={styles.progressContainer}>
              <div 
                className={styles.progressBar} 
                style={{ width: `${(round / totalRounds * 100)}%` }}
              ></div>
              <span className={styles.progressText}>{round}/{totalRounds}</span>
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
              <span className={styles.targetSound}>{targetSound.toUpperCase()}</span>
              <p>Listen for this sound in the words!</p>
            </div>
          </div>
          
          <div className={`${styles.infoBox} ${styles.examples}`}>
            <h4>Examples:</h4>
            <p>{examples}</p>
          </div>
          
          <div className={`${styles.infoBox} ${styles.difficulty}`}>
            <p>Difficulty Level: {difficulty}</p>
          </div>
          
          <div className={`${styles.infoBox} ${styles.instructions}`}>
            <p>Choose animals that contain the target sound.</p>
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