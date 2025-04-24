// src/pages/games/soundsafari/SoundIntroScreren/index.jsx <updated on 2025-04-25>

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SOUND_EXAMPLES, SOUND_DESCRIPTIONS } from '../../../../mock/soundSafariData'; 
import styles from '../../../../styles/games/safari/SoundSafari.module.css';
import { playSpeech } from '../../../../utils/soundUtils';

/**
 * Component for introducing the target sound to players
 */
const SoundIntroScreen = ({ targetSound, onContinue }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeExample, setActiveExample] = useState(null);

  // Get examples for this target sound
  const examples = SOUND_EXAMPLES[targetSound] || [];
  
  // Get sound description
  const soundDescription = SOUND_DESCRIPTIONS[targetSound] || 'Listen carefully for this sound';

  // Play sound function
  const playSound = () => {
    setIsPlaying(true);
    playSpeech(targetSound, 0.7, () => setIsPlaying(false));
  };

  // Play example word
  const playExampleWord = (word) => {
    setActiveExample(word);
    playSpeech(word, 0.8, () => setActiveExample(null));
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>
          Listen for the Sound
          <span role="img" aria-label="Listening" className={styles.headerEmoji}>👂</span>
        </h2>
        <p className={styles.cardSubtitle}>Learn to identify the "{targetSound}" sound</p>
      </div>
      
      <div className={styles.soundCircleWrapper}>
        <motion.div 
          className={styles.soundCircle}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={playSound}
        >
          <span className={styles.soundLetter}>
            {targetSound.toUpperCase()} {targetSound.toLowerCase()}
          </span>
          {isPlaying && (
            <div className={styles.soundWaves}>
              {[...Array(3)].map((_, i) => (
                <motion.div 
                  key={i}
                  className={styles.soundWave}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.7, 0.3, 0]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.3
                  }}
                />
              ))}
            </div>
          )}
        </motion.div>
        
        <motion.p 
          className={styles.tapInstruction}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Tap to hear sound
        </motion.p>
      </div>
      
      <div className={styles.infoContainer}>
        <div className={styles.soundDescription}>
          <div className={styles.sectionTitle}>
            <span role="img" aria-label="How to" className={styles.titleEmoji}>🔤</span>
            <h3>How to make this sound:</h3>
          </div>
          <div className={styles.descriptionBox}>
            <p>{soundDescription}</p>
          </div>
        </div>
        
        <motion.div 
          className={styles.examplesContainer}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className={styles.sectionTitle}>
            <span role="img" aria-label="Examples" className={styles.titleEmoji}>✨</span>
            <h3>Example words with "{targetSound}" sound:</h3>
          </div>
          
          <div className={styles.exampleWords}>
            {examples.slice(0, 4).map((word, index) => (
              <motion.div 
                key={index} 
                className={`${styles.exampleWord} ${activeExample === word ? styles.activeExample : ''}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => playExampleWord(word)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + (index * 0.1) }}
              >
                <span>{word}</span>
                <motion.div 
                  className={styles.playIcon}
                  animate={activeExample === word ? { 
                    scale: [1, 1.2, 1],
                    color: ['#4a9240', '#ffd600', '#4a9240'] 
                  } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  🔊
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
      
      <div className={styles.taskContainer}>
        <div className={styles.sectionTitle}>
          <span role="img" aria-label="Task" className={styles.titleEmoji}>🎯</span>
          <h3>Your Safari Task:</h3>
        </div>
        <div className={styles.taskBox}>
          <p>Find animals that have the "{targetSound}" sound in their names</p>
        </div>
      </div>
      
      <motion.button 
        className={styles.continueButton}
        whileHover={{ scale: 1.05, boxShadow: "0 8px 16px rgba(0,0,0,0.2)" }}
        whileTap={{ scale: 0.95 }}
        onClick={onContinue}
      >
        Start the Safari!
        <span role="img" aria-label="Start" className={styles.buttonEmoji}>🦁</span>
      </motion.button>
    </div>
  );
};

export default SoundIntroScreen;