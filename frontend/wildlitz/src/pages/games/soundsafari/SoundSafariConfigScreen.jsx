// src/pages/games/syllable/SoundSafariConfigScreen.jsx <current update > 2025-04-24 4:12pm>
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import styles from '../../../styles/SoundSafariConfig.module.css';

/**
 * Configuration screen component for Sound Safari game
 * Redesigned with absolutely no overflow/scroll for TV display
 * Layout improved to be more occupied and immersive
 */
const SoundSafariConfigScreen = ({ onStartGame }) => {
  // Game configuration state
  const [soundPosition, setSoundPosition] = useState('beginning'); // 'beginning', 'middle', 'ending', 'anywhere'
  const [environment, setEnvironment] = useState('jungle'); // 'jungle', 'savanna', 'ocean', 'arctic'
  const [difficulty, setDifficulty] = useState('easy'); // 'easy', 'medium', 'hard'

  // Handle sound position selection
  const handleSoundPositionChange = (position) => {
    setSoundPosition(position);
  };
  
  // Handle environment selection
  const handleEnvironmentChange = (env) => {
    setEnvironment(env);
  };

  // Handle difficulty selection
  const handleDifficultyChange = (level) => {
    setDifficulty(level);
  };
  
  // Handle start game with quick default settings
  const handleQuickStart = () => {
    // Set some reasonable defaults and start
    const gameConfig = {
      soundPosition: 'beginning',
      targetSound: 's',
      environment: 'jungle',
      difficulty: 'easy'
    };
    
    if (onStartGame) {
      onStartGame(gameConfig);
    }
  };
  
  // Handle start game with custom settings
  const handleBeginGame = () => {
    const gameConfig = {
      soundPosition,
      targetSound: 's', // Default to 's' as per requirements
      environment,
      difficulty
    };
    
    if (onStartGame) {
      onStartGame(gameConfig);
    }
  };
  
  return (
    <motion.div 
      className={styles.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={styles.configContent}>
        <h1 className={styles.configTitle}>WildLitz - Sound Safari Adventure</h1>
        
        <motion.button 
          className={styles.quickStartButton}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleQuickStart}
        >
          Quick Start
        </motion.button>
        
        {/* Redesigned grid layout to avoid scrolling */}
        <div className={styles.configGrid}>
          {/* Left Column */}
          <div className={styles.configColumn}>
            {/* Sound Position Section */}
            <div className={styles.configSection}>
              <h2>Sound Target Position</h2>
              <div className={styles.soundPositionOptions}>
                <motion.button 
                  className={`${styles.positionButton} ${soundPosition === 'beginning' ? styles.selected : ''}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSoundPositionChange('beginning')}
                >
                  Beginning
                </motion.button>
                
                <motion.button 
                  className={`${styles.positionButton} ${soundPosition === 'middle' ? styles.selected : ''}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSoundPositionChange('middle')}
                >
                  Middle
                </motion.button>
                
                <motion.button 
                  className={`${styles.positionButton} ${soundPosition === 'ending' ? styles.selected : ''}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSoundPositionChange('ending')}
                >
                  Ending
                </motion.button>
                
                <motion.button 
                  className={`${styles.positionButton} ${soundPosition === 'anywhere' ? styles.selected : ''}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSoundPositionChange('anywhere')}
                >
                  Anywhere
                </motion.button>
              </div>
            </div>
            
            {/* Difficulty Section */}
            <div className={styles.configSection}>
              <h2>Difficulty Level</h2>
              <div className={styles.difficultyOptions}>
                <motion.button 
                  className={`${styles.difficultyButton} ${difficulty === 'easy' ? styles.selected : ''}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDifficultyChange('easy')}
                >
                  <span className={styles.difficultyLabel}>Easy</span>
                  <span className={styles.difficultyDescription}>6 animals, 60 seconds</span>
                </motion.button>
                
                <motion.button 
                  className={`${styles.difficultyButton} ${difficulty === 'medium' ? styles.selected : ''}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDifficultyChange('medium')}
                >
                  <span className={styles.difficultyLabel}>Medium</span>
                  <span className={styles.difficultyDescription}>8 animals, 45 seconds</span>
                </motion.button>
                
                <motion.button 
                  className={`${styles.difficultyButton} ${difficulty === 'hard' ? styles.selected : ''}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDifficultyChange('hard')}
                >
                  <span className={styles.difficultyLabel}>Hard</span>
                  <span className={styles.difficultyDescription}>12 animals, 30 seconds</span>
                </motion.button>
              </div>
            </div>
          </div>
          
          {/* Middle Column */}
          <div className={styles.configColumn}>
            {/* Environment Section */}
            <div className={styles.configSection}>
              <h2>Select Environment</h2>
              <div className={styles.environmentOptions}>
                <motion.button 
                  className={`${styles.environmentButton} ${styles.jungle} ${environment === 'jungle' ? styles.selected : ''}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleEnvironmentChange('jungle')}
                >
                  <span className={styles.envIcon}>🌴</span>
                  Jungle
                </motion.button>
                
                <motion.button 
                  className={`${styles.environmentButton} ${styles.savanna} ${environment === 'savanna' ? styles.selected : ''}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleEnvironmentChange('savanna')}
                >
                  <span className={styles.envIcon}>🦒</span>
                  Savanna
                </motion.button>
                
                <motion.button 
                  className={`${styles.environmentButton} ${styles.ocean} ${environment === 'ocean' ? styles.selected : ''}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleEnvironmentChange('ocean')}
                >
                  <span className={styles.envIcon}>🌊</span>
                  Ocean
                </motion.button>
                
                <motion.button 
                  className={`${styles.environmentButton} ${styles.arctic} ${environment === 'arctic' ? styles.selected : ''}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleEnvironmentChange('arctic')}
                >
                  <span className={styles.envIcon}>❄️</span>
                  Arctic
                </motion.button>
              </div>
            </div>
          </div>
          
          {/* Right Column */}
          <div className={styles.configColumn}>
            {/* Game Information Section */}
            <div className={styles.gameInfoSection}>
              <div className={styles.gameInfo}>
                <h3>🔍 About Sound Safari</h3>
                <p>Help students identify and recognize phonetic sounds in words through this exciting safari adventure!</p>
              </div>
              
              <div className={styles.gameInfo}>
                <h3>🎮 How to Play</h3>
                <p>Listen to the target sound, then find animals that have that sound in their names. Easy to learn, fun to master!</p>
              </div>
              
              <div className={styles.gameInfo}>
                <h3>🏆 Learning Goals</h3>
                <p>Improve phonemic awareness, sound recognition, and vocabulary through engaging gameplay.</p>
              </div>
              
              <div className={styles.gameInfo}>
                <h3>👩‍🏫 Teacher Tip</h3>
                <p>Try different difficulty levels and environments to keep students excited about learning sound patterns!</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className={styles.configActions}>
          <motion.button 
            className={styles.backButton}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.history.back()}
          >
            Back
          </motion.button>
          
          <motion.button 
            className={styles.startButton}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBeginGame}
          >
            Start Safari
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default SoundSafariConfigScreen;