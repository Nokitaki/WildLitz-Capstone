import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VanishingGameConfigScreen from '../../configs/VanishingGameConfigScreen';
import styles from '../../styles/VanishingGame.module.css';

const VanishingGame = () => {
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
        return <VanishingGameConfigScreen onStartGame={handleStartGame} />;
        
      case 'playing':
        // This would be your actual game component
        return (
          <div className={styles.container}>
            <div className={styles.header}>
              <h1>WildLitz - Enhanced Vanishing Game</h1>
              <p>Read the content before it disappears!</p>
            </div>
            <div className={styles.gameContent}>
              <h2>Game in Development</h2>
              <p>The game is currently under development. You've selected:</p>
              <ul className={styles.configSummary}>
                <li>Challenge Level: {gameConfig?.challengeLevel || 'N/A'}</li>
                <li>Learning Focus: {gameConfig?.learningFocus || 'N/A'}</li>
                <li>Difficulty: {gameConfig?.difficulty || 'N/A'}</li>
              </ul>
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
        return <VanishingGameConfigScreen onStartGame={handleStartGame} />;
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

export default VanishingGame;