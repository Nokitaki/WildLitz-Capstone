// src/pages/games/soundsafari/SoundSafariConfigScreen.jsx <updated on 2025-04-25>
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import styles from '../../../styles/games/safari/SoundSafariConfig.module.css';

/**
 * Configuration screen component for Sound Safari game
 * Redesigned with horizontal layout and no overflow/scroll
 */
const SoundSafariConfigScreen = ({ onStartGame }) => {
  // Game configuration state
  const [soundPosition, setSoundPosition] = useState('beginning');
  const [environment, setEnvironment] = useState('jungle');
  const [difficulty, setDifficulty] = useState('easy');
  
  // Handle quick start with default settings
  const handleQuickStart = () => {
    const config = {
      soundPosition: 'beginning',
      targetSound: 's',
      environment: 'jungle',
      difficulty: 'easy'
    };
    
    if (onStartGame) {
      onStartGame(config);
    }
  };
  
  // Handle start game with custom settings
  const handleStartGame = () => {
    const config = {
      soundPosition,
      targetSound: 's', // Default to 's' sound
      environment,
      difficulty
    };
    
    if (onStartGame) {
      onStartGame(config);
    }
  };
  
  return (
    <div className={styles.configContainer}>
      <div className={styles.configCardWrapper}>
        <div className={styles.configHeader}>
          <h1 className={styles.configTitle}>
            Sound Safari <span>Adventure</span>
          </h1>
          <p className={styles.configSubtitle}>
            Help animals find their sounds in this exciting adventure!
          </p>
        </div>
        
        <div className={styles.configContent}>
          {/* Left Column - Game Info */}
          <div className={styles.configColumn}>
            <div className={styles.gameInfoSection}>
              <div className={styles.infoBox}>
                <h3>
                  <span className={styles.infoEmoji}>🎮</span>
                  How to Play
                </h3>
                <p>Listen for the target sound and find animals with that sound in their names. Select all matching animals before time runs out!</p>
              </div>
              
              <div className={styles.infoBox}>
                <h3>
                  <span className={styles.infoEmoji}>🏆</span>
                  Learning Goals
                </h3>
                <p>Improve phonemic awareness, sound recognition, and vocabulary building through engaging gameplay.</p>
              </div>
              
              <div className={styles.infoBox}>
                <h3>
                  <span className={styles.infoEmoji}>👩‍🏫</span>
                  Teacher Tips
                </h3>
                <p>Use different difficulty levels to match student abilities. Discuss animal names and sounds to reinforce phonetic concepts.</p>
              </div>
              
      
            </div>
          </div>
          
          {/* Center Column - Environment */}
          <div className={styles.configColumn}>
            <div className={styles.configSection}>
              <h2>
                <span className={styles.sectionEmoji}>🌍</span>
                Environment
              </h2>
              <div className={styles.environmentGrid}>
                <motion.button
                  className={`${styles.environmentButton} ${styles.jungleEnv} ${environment === 'jungle' ? styles.selected : ''}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setEnvironment('jungle')}
                >
                  <span className={styles.envEmoji}>🌴</span>
                  <span>Jungle</span>
                </motion.button>
                
                <motion.button
                  className={`${styles.environmentButton} ${styles.savannaEnv} ${environment === 'savanna' ? styles.selected : ''}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setEnvironment('savanna')}
                >
                  <span className={styles.envEmoji}>🦒</span>
                  <span>Savanna</span>
                </motion.button>
                
                <motion.button
                  className={`${styles.environmentButton} ${styles.oceanEnv} ${environment === 'ocean' ? styles.selected : ''}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setEnvironment('ocean')}
                >
                  <span className={styles.envEmoji}>🌊</span>
                  <span>Ocean</span>
                </motion.button>
                
                <motion.button
                  className={`${styles.environmentButton} ${styles.arcticEnv} ${environment === 'arctic' ? styles.selected : ''}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setEnvironment('arctic')}
                >
                  <span className={styles.envEmoji}>❄️</span>
                  <span>Arctic</span>
                </motion.button>
              </div>
              
              <div className={styles.startButtonContainer}>
                <motion.button 
                  className={styles.startButton}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStartGame}
                >
                  <span className={styles.buttonEmoji}>🚀</span>
                  Start Adventure
                </motion.button>
              </div>
            </div>
          </div>
          
          {/* Right Column - Sound Position & Difficulty */}
          <div className={styles.configColumn}>
            <div className={styles.configSection}>
              <h2>
                <span className={styles.sectionEmoji}>🔍</span>
                Sound Position
              </h2>
              <div className={styles.buttonGrid}>
                <motion.button
                  className={`${styles.optionButton} ${soundPosition === 'beginning' ? styles.selected : ''}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSoundPosition('beginning')}
                >
                  Beginning
                </motion.button>
                
                <motion.button
                  className={`${styles.optionButton} ${soundPosition === 'middle' ? styles.selected : ''}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSoundPosition('middle')}
                >
                  Middle
                </motion.button>
                
                <motion.button
                  className={`${styles.optionButton} ${soundPosition === 'ending' ? styles.selected : ''}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSoundPosition('ending')}
                >
                  Ending
                </motion.button>
                
                <motion.button
                  className={`${styles.optionButton} ${soundPosition === 'anywhere' ? styles.selected : ''}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSoundPosition('anywhere')}
                >
                  Anywhere
                </motion.button>
              </div>
            </div>
            
            <div className={styles.configSection}>
              <h2>
                <span className={styles.sectionEmoji}>🎚️</span>
                Difficulty Level
              </h2>
              <div className={styles.difficultyButtons}>
                <motion.button
                  className={`${styles.difficultyButton} ${difficulty === 'easy' ? styles.selected : ''}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDifficulty('easy')}
                >
                  <div className={styles.difficultyTitle}>Easy</div>
                  <div className={styles.difficultyDetails}>
                    <span>6 animals</span>
                    <span>60 seconds</span>
                  </div>
                </motion.button>
                
                <motion.button
                  className={`${styles.difficultyButton} ${difficulty === 'medium' ? styles.selected : ''}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDifficulty('medium')}
                >
                  <div className={styles.difficultyTitle}>Medium</div>
                  <div className={styles.difficultyDetails}>
                    <span>8 animals</span>
                    <span>45 seconds</span>
                  </div>
                </motion.button>
                
                <motion.button
                  className={`${styles.difficultyButton} ${difficulty === 'hard' ? styles.selected : ''}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDifficulty('hard')}
                >
                  <div className={styles.difficultyTitle}>Hard</div>
                  <div className={styles.difficultyDetails}>
                    <span>12 animals</span>
                    <span>30 seconds</span>
                  </div>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoundSafariConfigScreen;