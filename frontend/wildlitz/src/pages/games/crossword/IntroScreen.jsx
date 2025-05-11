// src/pages/games/crossword/IntroScreen.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import styles from '../../../styles/games/crossword/IntroScreen.module.css';

/**
 * Introduction screen for Crossword Puzzle game
 * Allows selection of theme and difficulty
 */
const IntroScreen = ({ onStartGame, themes }) => {
  // Game options
  const [selectedTheme, setSelectedTheme] = useState('animals');
  
  // Handle theme selection
  const handleThemeSelect = (theme) => {
    setSelectedTheme(theme);
  };
  
  // Handle start game
  const handleStartGame = () => {
    const config = {
      theme: selectedTheme,
      difficulty: 'easy' // Default to easy difficulty
    };
    
    onStartGame(config);
  };
  
  return (
    <div className={styles.introContainer}>
      <div className={styles.introCard}>
        <div className={styles.headerSection}>
          <h1 className={styles.mainTitle}>Word Detective: Crossword Challenge</h1>
          <p className={styles.subtitle}>
            Solve the crossword puzzles to improve your vocabulary and sentence building skills!
          </p>
        </div>
        
        {/* Theme Selection */}
        <div className={styles.optionsSection}>
          <div className={styles.themeSelection}>
            <h2 className={styles.sectionTitle}>Select Theme:</h2>
            <div className={styles.themeOptions}>
              {themes && Object.keys(themes).map(theme => (
                <motion.button
                  key={theme}
                  className={`${styles.themeButton} ${selectedTheme === theme ? styles.selected : ''}`}
                  onClick={() => handleThemeSelect(theme)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {themes[theme].name}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Start Button */}
        <div className={styles.startButtonContainer}>
          <motion.button
            className={styles.startButton}
            onClick={handleStartGame}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Start
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default IntroScreen;