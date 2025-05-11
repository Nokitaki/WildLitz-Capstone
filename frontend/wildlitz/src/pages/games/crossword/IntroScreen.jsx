// src/pages/games/crossword/IntroScreen.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import styles from '../../../styles/games/crossword/IntroScreen.module.css';

/**
 * IntroScreen component for the Crossword Game
 * Allows selecting theme and difficulty
 */
const IntroScreen = ({ themes, onStartGame }) => {
  // Game configuration state
  const [selectedTheme, setSelectedTheme] = useState('animals');
  const [difficulty, setDifficulty] = useState('easy');
  
  // Handle start game button click
  const handleStartGame = () => {
    const config = {
      theme: selectedTheme,
      difficulty
    };
    
    if (onStartGame) {
      onStartGame(config);
    }
  };
  
  // Get available themes as array
  const getThemesArray = () => {
    return Object.entries(themes).map(([key, theme]) => ({
      id: key,
      ...theme
    }));
  };
  
  const themeOptions = getThemesArray();
  
  return (
    <div className={styles.introContainer}>
      <div className={styles.introCard}>
        {/* Header */}
        <div className={styles.headerSection}>
          <h1 className={styles.mainTitle}>WildLitz Word Explorer</h1>
          <p className={styles.subtitle}>Solve crossword puzzles to learn new vocabulary!</p>
        </div>
        
        {/* Options section */}
        <div className={styles.optionsSection}>
          {/* Theme selection */}
          <div className={styles.themeSelection}>
            <h2 className={styles.sectionTitle}>Select a Theme:</h2>
            <div className={styles.themeOptions}>
              {themeOptions.map(theme => (
                <motion.button
                  key={theme.id}
                  className={`${styles.themeButton} ${selectedTheme === theme.id ? styles.selected : ''}`}
                  onClick={() => setSelectedTheme(theme.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {theme.name}
                </motion.button>
              ))}
            </div>
            
            {/* Description of selected theme */}
            <div className={styles.themeDescription}>
              {selectedTheme && themes[selectedTheme] && (
                <p>{themes[selectedTheme].description}</p>
              )}
            </div>
          </div>
          
          {/* Difficulty selection */}
          <div className={styles.themeSelection}>
            <h2 className={styles.sectionTitle}>Select Difficulty:</h2>
            <div className={styles.themeOptions}>
              <motion.button
                className={`${styles.themeButton} ${difficulty === 'easy' ? styles.selected : ''}`}
                onClick={() => setDifficulty('easy')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Easy
              </motion.button>
              
              <motion.button
                className={`${styles.themeButton} ${difficulty === 'medium' ? styles.selected : ''}`}
                onClick={() => setDifficulty('medium')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Medium
              </motion.button>
              
              <motion.button
                className={`${styles.themeButton} ${difficulty === 'hard' ? styles.selected : ''}`}
                onClick={() => setDifficulty('hard')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Hard
              </motion.button>
            </div>
          </div>
        </div>
        
        {/* Start button */}
        <div className={styles.startButtonContainer}>
          <motion.button
            className={styles.startButton}
            onClick={handleStartGame}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Start Game
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default IntroScreen;