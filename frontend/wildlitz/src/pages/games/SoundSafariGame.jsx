import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SoundSafariConfigScreen from '../../configs/SoundSafariConfigScreen';
import SoundSafariLoadingScreen from './SoundSafariLoadingScreen';
import styles from '../../styles/SoundSafariGame.module.css';

const SoundSafariGame = () => {
  // Game state management
  const [gameState, setGameState] = useState('config'); // 'config', 'loading', 'playing', 'feedback'
  const [gameConfig, setGameConfig] = useState(null);
  
  // Handle starting the game after configuration
  const handleStartGame = (config) => {
    console.log('Starting game with config:', config);
    setGameConfig(config);
    setGameState('loading');
    
    // Simulate loading time before starting the actual game
    setTimeout(() => {
      setGameState('playing');
    }, 3000);
  };
  
  // Handle loading screen continue button
  const handleContinueFromLoading = () => {
    setGameState('playing');
  };
  
  // Render different game states
  const renderGameContent = () => {
    switch (gameState) {
      case 'config':
        return <SoundSafariConfigScreen onStartGame={handleStartGame} />;
        
      case 'loading':
        return (
          <SoundSafariLoadingScreen 
            targetSound={gameConfig?.targetSound || 'S'} 
            difficulty={gameConfig?.difficulty || 'Medium'} 
            onContinue={handleContinueFromLoading}
          />
        );
        
      case 'playing':
        // This would be your actual game component
        return (
          <div className={styles.container}>
            <div className={styles.header}>
              <h1>WildLitz - Sound Safari Game</h1>
            </div>
            <div className={styles.gameScreen}>
              <h2>Sound Safari Game</h2>
              <p>Game is under development. You selected:</p>
              <ul style={{ listStyle: 'none', padding: '20px', background: '#ffffff', borderRadius: '10px', color: '#333' }}>
                <li>Play Mode: {gameConfig?.playMode}</li>
                <li>Sound Position: {gameConfig?.soundPosition}</li>
                <li>Target Sound: {gameConfig?.targetSound}</li>
                <li>Environment: {gameConfig?.environment}</li>
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
        return <SoundSafariConfigScreen onStartGame={handleStartGame} />;
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

export default SoundSafariGame;