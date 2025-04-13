import React, { useState } from 'react';
import { motion } from 'framer-motion';
import styles from '../../../styles/CrosswordPuzzle.module.css';

const CrosswordPuzzleConfigScreen = ({ onStartGame }) => {
  // Game configuration state
  const [theme, setTheme] = useState('animals');
  
  // Handle theme selection
  const handleThemeChange = (selectedTheme) => {
    setTheme(selectedTheme);
  };
  
  // Handle start game
  const handleStartGame = () => {
    const gameConfig = {
      theme,
      playMode: 'group' // Fixed to group play as requested
    };
    
    if (onStartGame) {
      onStartGame(gameConfig);
    }
  };
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>WildLitz - Crossword Puzzle Challenge</h1>
      </div>
      
      <div className={styles.configCard}>
        <h2 className={styles.subtitle}>Word Detectives: Crossword Challenge</h2>
        <p className={styles.description}>
          Solve the crossword puzzles to improve your vocabulary and sentence building skills!
        </p>
        
        <h3 className={styles.sectionTitle}>Select Theme:</h3>
        <div className={styles.themeSelector}>
          <button 
            className={`${styles.themeButton} ${theme === 'animals' ? styles.selected : ''}`}
            onClick={() => handleThemeChange('animals')}
          >
            Animals
          </button>
          <button 
            className={`${styles.themeButton} ${theme === 'space' ? styles.selected : ''}`}
            onClick={() => handleThemeChange('space')}
          >
            Space
          </button>
          <button 
            className={`${styles.themeButton} ${theme === 'sports' ? styles.selected : ''}`}
            onClick={() => handleThemeChange('sports')}
          >
            Sports
          </button>
        </div>
        
        <button 
          className={styles.startButton}
          onClick={handleStartGame}
        >
          Start
        </button>
      </div>
    </div>
  );
};

export default CrosswordPuzzleConfigScreen;