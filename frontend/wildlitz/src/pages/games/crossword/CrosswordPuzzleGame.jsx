import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CrosswordPuzzleConfigScreen from './CrosswordPuzzleConfigScreen';
import styles from '../../../styles/CrosswordPuzzle.module.css';

const CrosswordPuzzleGame = () => {
  // Game state management
  const [gameState, setGameState] = useState('config'); // 'config', 'playing', 'feedback'
  const [gameConfig, setGameConfig] = useState(null);
  
  // Handle starting the game after configuration
  const handleStartGame = (config) => {
    console.log('Starting game with config:', config);
    setGameConfig(config);
    setGameState('playing');
  };
  
  // Render different game states
  const renderGameContent = () => {
    switch (gameState) {
      case 'config':
        return <CrosswordPuzzleConfigScreen onStartGame={handleStartGame} />;
        
      case 'playing':
        // This would be your actual game component
        return (
          <div className={styles.container}>
            <div className={styles.header}>
              <h1>WildLitz - Crossword Puzzle Challenge</h1>
            </div>
            <div className={styles.gameArea}>
              <h2>Game in Development</h2>
              <p>The Crossword Puzzle game is currently under development.</p>
              <p>You selected the <strong>{gameConfig?.theme}</strong> theme.</p>
              <button 
                className={styles.backButton}
                onClick={() => setGameState('config')}
              >
                Back to Config
              </button>
            </div>
          </div>
        );
        
      default:
        return <CrosswordPuzzleConfigScreen onStartGame={handleStartGame} />;
    }
  };
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={gameState}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderGameContent()}
      </motion.div>
    </AnimatePresence>
  );
};

export default CrosswordPuzzleGame;