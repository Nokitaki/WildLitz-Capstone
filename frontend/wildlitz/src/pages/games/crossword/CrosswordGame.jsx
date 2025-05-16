// src/pages/games/crossword/CrosswordGame.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../../styles/games/crossword/CrosswordGame.module.css';

// Import game screens
import IntroScreen from './IntroScreen';
import GameplayScreen from './GameplayScreen';
import SummaryScreen from './SummaryScreen';
import SentenceBuilderScreen from './SentenceBuilderScreen';

// Import mock data
import { CROSSWORD_PUZZLES, THEMES } from '../../../mock/crosswordGameData';

/**
 * Main Crossword Puzzle Game component that manages game state and flow
 */
const CrosswordGame = () => {
  // Game states: 'intro', 'gameplay', 'summary', 'sentence-builder'
  const [gameState, setGameState] = useState('intro');
  
  // Game configuration
  const [gameConfig, setGameConfig] = useState({
    theme: 'animals',
    difficulty: 'easy'
  });
  
  // Game data
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [solvedWords, setSolvedWords] = useState([]);
  const [timeSpent, setTimeSpent] = useState(0);
  
  // Timer
  const [timerActive, setTimerActive] = useState(false);
  
  // Start timer when in gameplay mode
  useEffect(() => {
    let timer;
    if (timerActive && gameState === 'gameplay') {
      timer = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timerActive, gameState]);
  
  /**
   * Handle starting the game with selected configuration
   */
  const handleStartGame = (config) => {
    setGameConfig(config);
    
    // Get puzzle based on theme and difficulty
    const puzzles = CROSSWORD_PUZZLES[config.theme] || [];
    const filteredPuzzles = puzzles.filter(puzzle => puzzle.difficulty === config.difficulty);
    
    if (filteredPuzzles.length > 0) {
      // Randomly select a puzzle
      const randomIndex = Math.floor(Math.random() * filteredPuzzles.length);
      setCurrentPuzzle(filteredPuzzles[randomIndex]);
      
      // Reset game state
      setSolvedWords([]);
      setTimeSpent(0);
      setTimerActive(true);
      
      // Move to gameplay screen
      setGameState('gameplay');
    } else {
      // Handle case where no puzzles match criteria
      console.error('No puzzles available for the selected configuration');
    }
  };
  
  /**
   * Handle word solved in crossword
   */
  const handleWordSolved = (word, definition, example) => {
    // Add to solved words
    setSolvedWords(prev => [
      ...prev, 
      {
        word,
        definition,
        example,
        timestamp: new Date()
      }
    ]);
    
    // Check if puzzle is complete
    if (currentPuzzle && solvedWords.length + 1 >= currentPuzzle.wordCount) {
      // Stop timer
      setTimerActive(false);
      
      // Move to summary screen
      setTimeout(() => {
        setGameState('summary');
      }, 1000);
    }
  };
  
  /**
   * Handle going to sentence builder
   */
  const handleGoToSentenceBuilder = () => {
    setGameState('sentence-builder');
  };
  
  /**
   * Handle returning to main menu
   */
  const handleReturnToMenu = () => {
    setGameState('intro');
  };
  
  /**
   * Handle playing again
   */
  const handlePlayAgain = () => {
    // Reset game state
    setSolvedWords([]);
    setTimeSpent(0);
    
    // Move back to intro screen for new configuration
    setGameState('intro');
  };
  
  /**
   * Format time display (mm:ss)
   */
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  return (
    <div className={styles.gameContainer}>
      <div className={styles.gameContent}>
        <AnimatePresence mode="wait">
          {gameState === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.screenContainer}
            >
              <IntroScreen 
                onStartGame={handleStartGame} 
                themes={THEMES}
              />
            </motion.div>
          )}
          
          {gameState === 'gameplay' && currentPuzzle && (
            <motion.div
              key="gameplay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.screenContainer}
            >
              <GameplayScreen 
                puzzle={currentPuzzle}
                theme={gameConfig.theme}
                onWordSolved={handleWordSolved}
                solvedWords={solvedWords}
                timeFormatted={formatTime(timeSpent)}
              />
            </motion.div>
          )}
          
          {gameState === 'summary' && (
            <motion.div
              key="summary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.screenContainer}
            >
              <SummaryScreen 
                solvedWords={solvedWords}
                timeSpent={timeSpent}
                timeFormatted={formatTime(timeSpent)}
                theme={gameConfig.theme}
                onPlayAgain={handlePlayAgain}
                onBuildSentences={handleGoToSentenceBuilder}
                onReturnToMenu={handleReturnToMenu}
                totalWords={currentPuzzle ? currentPuzzle.wordCount : 0}
              />
            </motion.div>
          )}
          
          {gameState === 'sentence-builder' && (
            <motion.div
              key="sentence-builder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.screenContainer}
            >
              <SentenceBuilderScreen 
                words={solvedWords}
                onReturnToSummary={() => setGameState('summary')}
                onReturnToMenu={handleReturnToMenu}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CrosswordGame;