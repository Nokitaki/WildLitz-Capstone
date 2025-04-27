// src/pages/games/soundsafari/SoundSafariGame.jsx <updated on 2025-04-27>

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../../styles/games/safari/SoundSafariGame.module.css';

// Import mascot
import WildLitzFox from '../../../assets/img/wildlitz-idle.png';

// Import components
import SoundSafariConfigScreen from './SoundSafariConfigScreen';
import SoundSafariLoadingScreen from './SoundSafariLoadingScreen';
import SoundIntroScreen from './SoundIntroScreen';
import GameplayScreen from './GameplayScreen';
import ResultsScreen from './ResultScreen';
import GameCompleteScreen from './GameCompleteScreen';

// Import mock data
import { 
  ANIMALS_DATA, 
  SOUND_DESCRIPTIONS, 
  SOUND_POSITIONS, 
  DIFFICULTY_LEVELS,
  ENVIRONMENTS 
} from '../../../mock/soundSafariData';

/**
 * Main Sound Safari Game component that manages game state and flow
 * Redesigned with horizontal layout, no overflow/scrolling, and compact layout
 */
const SoundSafariGame = () => {
  // Game states: 'config', 'loading', 'intro', 'gameplay', 'results', 'complete'
  const [gameState, setGameState] = useState('config');
  
  // Game configuration
  const [gameConfig, setGameConfig] = useState({
    difficulty: 'easy',
    targetSound: 's',
    soundPosition: SOUND_POSITIONS.beginning,
    environment: 'jungle'
  });
  
  // Game progress
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds] = useState(5);
  const [score, setScore] = useState(0);
  
  // Round data
  const [roundAnimals, setRoundAnimals] = useState([]);
  const [selectedAnimals, setSelectedAnimals] = useState([]);
  
  // Keep track of used sounds to avoid repetition
  const [soundsUsed, setSoundsUsed] = useState([]);
  
  // Character speech bubble
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleMessage, setBubbleMessage] = useState("");
  
  /**
   * Handle starting a new game with the given configuration
   */
  const handleStartGame = (config) => {
    setGameConfig(config);
    setCurrentRound(1);
    setScore(0);
    setSoundsUsed([config.targetSound]);
    setGameState('loading');
    
    // Prepare first round
    prepareNewRound(config.targetSound, config.difficulty);
    
    // Simulate loading time
    setTimeout(() => {
      setGameState('intro');
    }, 2000);
  };
  
  /**
   * Prepare a new round of the game
   */
  const prepareNewRound = (targetSound = gameConfig.targetSound, difficulty = gameConfig.difficulty) => {
    // Set sound position based on difficulty
    const difficultySettings = DIFFICULTY_LEVELS[difficulty];
    const positions = difficultySettings.soundPositions;
    const soundPosition = positions[Math.floor(Math.random() * positions.length)];
    
    // Update game config
    setGameConfig(prev => ({
      ...prev,
      targetSound,
      soundPosition
    }));
    
    // Prepare animals for this round
    prepareAnimals(targetSound, difficultySettings.numAnimals);
  };
  
  /**
   * Select a new target sound for the next round
   */
  const selectNewTargetSound = () => {
    // Get available sounds that haven't been used yet
    const availableSounds = Object.keys(SOUND_DESCRIPTIONS).filter(
      sound => !soundsUsed.includes(sound)
    );
    
    // If we have available sounds, select one randomly
    if (availableSounds.length > 0) {
      const newSound = availableSounds[Math.floor(Math.random() * availableSounds.length)];
      setSoundsUsed(prev => [...prev, newSound]);
      return newSound;
    }
    
    // If we've used all sounds, reset and pick a random one
    const allSounds = Object.keys(SOUND_DESCRIPTIONS);
    const newSound = allSounds[Math.floor(Math.random() * allSounds.length)];
    setSoundsUsed([newSound]);
    return newSound;
  };
  
  /**
   * Select animals for the round based on the target sound
   */
  const prepareAnimals = (sound, numAnimals) => {
    // Get animals that have the target sound
    const correctAnimals = ANIMALS_DATA.filter(animal => animal.hasSound === sound);
    
    // Get other animals without the target sound
    const incorrectAnimals = ANIMALS_DATA.filter(animal => animal.hasSound !== sound);
    
    // Determine how many correct animals to include (40-60% of total)
    const minCorrect = Math.max(2, Math.floor(numAnimals * 0.4));
    const maxCorrect = Math.min(correctAnimals.length, Math.ceil(numAnimals * 0.6));
    const numCorrect = Math.floor(Math.random() * (maxCorrect - minCorrect + 1)) + minCorrect;
    
    // Randomly select correct and incorrect animals
    const selectedCorrect = [...correctAnimals]
      .sort(() => 0.5 - Math.random())
      .slice(0, numCorrect);
      
    const selectedIncorrect = [...incorrectAnimals]
      .sort(() => 0.5 - Math.random())
      .slice(0, numAnimals - numCorrect);
    
    // Combine and shuffle
    const roundAnimals = [...selectedCorrect, ...selectedIncorrect]
      .sort(() => 0.5 - Math.random());
    
    setRoundAnimals(roundAnimals);
  };
  
  /**
   * Handle continuing from intro to gameplay
   */
  const handleContinueFromIntro = () => {
    setGameState('gameplay');
    setBubbleMessage(`Find animals with the "${gameConfig.targetSound}" sound!`);
    setShowBubble(true);
    
    // Hide the bubble after 5 seconds
    setTimeout(() => {
      setShowBubble(false);
    }, 5000);
  };
  
  /**
   * Handle continuing from loading to intro
   */
  const handleContinueFromLoading = () => {
    setGameState('intro');
  };
  
  /**
   * Handle submitting answers
   */
  const handleSubmitAnswers = (selected) => {
    setSelectedAnimals(selected);
    
    // Calculate correct answers
    const correctAnimals = roundAnimals.filter(animal => animal.hasSound === gameConfig.targetSound);
    
    // Calculate score (percentage of correct animals found)
    const correctSelected = selected.filter(animal => animal.hasSound === gameConfig.targetSound).length;
    const roundScore = Math.round((correctSelected / correctAnimals.length) * 100);
    
    setScore(prev => prev + roundScore);
    setGameState('results');
    
    const scoreMessage = roundScore >= 80 
      ? `Great job! You found ${correctSelected} of ${correctAnimals.length} animals with the "${gameConfig.targetSound}" sound!`
      : `You found ${correctSelected} of ${correctAnimals.length} animals with the "${gameConfig.targetSound}" sound. Keep practicing!`;
    
    setBubbleMessage(scoreMessage);
    setShowBubble(true);
    
    // Hide the bubble after 5 seconds
    setTimeout(() => {
      setShowBubble(false);
    }, 5000);
  };
  
  /**
   * Handle moving to next round
   */
  const handleNextRound = () => {
    if (currentRound >= totalRounds) {
      setGameState('complete');
    } else {
      setCurrentRound(prev => prev + 1);
      
      // Select a new target sound for the next round
      const newSound = selectNewTargetSound();
      
      // Prepare next round with the new sound
      prepareNewRound(newSound, gameConfig.difficulty);
      
      setGameState('loading');
      
      // Simulate loading time
      setTimeout(() => {
        setGameState('intro');
      }, 2000);
    }
  };
  
  /**
   * Handle trying the same round again
   */
  const handleTryAgain = () => {
    setGameState('intro');
  };
  
  /**
   * Handle playing again after game completion
   */
  const handlePlayAgain = () => {
    setCurrentRound(1);
    setScore(0);
    
    // Choose a new sound
    const newSound = selectNewTargetSound();
    
    // Prepare new round with this sound
    prepareNewRound(newSound, gameConfig.difficulty);
    
    setGameState('loading');
    
    // Simulate loading time
    setTimeout(() => {
      setGameState('intro');
    }, 2000);
  };
  
  /**
   * Handle changing difficulty after game completion
   */
  const handleChangeDifficulty = () => {
    // Reset to config screen
    setGameState('config');
  };
  
  /**
   * Get environment background class based on selected environment
   */
  const getEnvironmentClass = () => {
    switch(gameConfig.environment) {
      case 'jungle': return styles.jungleBackground;
      case 'savanna': return styles.savannaBackground;
      case 'ocean': return styles.oceanBackground;
      case 'arctic': return styles.arcticBackground;
      default: return styles.jungleBackground;
    }
  };
  
  /**
   * Calculate final stats for results screen
   */
  const getGameResults = () => {
    // Calculate which animals were correct and incorrect
    const correctAnimals = roundAnimals.filter(animal => animal.hasSound === gameConfig.targetSound);
    const incorrectAnimals = roundAnimals.filter(animal => animal.hasSound !== gameConfig.targetSound);
    
    return {
      correctAnimals,
      incorrectAnimals,
      selectedAnimals,
      targetSound: gameConfig.targetSound
    };
  };
  
  /**
   * Render the progress indicator
   */
  const renderProgressIndicator = () => {
    if (gameState === 'config' && gameConfig === 'intro') return null;
  };

  /**
   * Determine if the mascot should be shown
   */
  const shouldShowMascot = () => {
    return gameState === 'intro' || gameState === 'gameplay';
  };
  
  return (
    <div className={`${styles.gameContainer} ${getEnvironmentClass()}`}>
      <div className={styles.gameContent}>
        {renderProgressIndicator()}
        
        {/* Add Fox Mascot that only appears during intro and gameplay */}
        {shouldShowMascot() && (
          <motion.div
            className={styles.foxMascot}
            animate={{ 
              y: [0, -8, 0],
              rotate: [0, 2, 0, -2, 0]
            }}
            transition={{ 
              y: { repeat: Infinity, duration: 3, ease: "easeInOut" },
              rotate: { repeat: Infinity, duration: 2, ease: "easeInOut" }
            }}
          >
            <img src={WildLitzFox} alt="WildLitz Fox" className={styles.foxImage} />
            
            {showBubble && (
              <motion.div 
                className={styles.speechBubble}
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {bubbleMessage}
              </motion.div>
            )}
          </motion.div>
        )}
        
        <AnimatePresence mode="wait">
          {gameState === 'config' && (
            <motion.div
              key="config"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.screenContainer}
            >
              <SoundSafariConfigScreen onStartGame={handleStartGame} />
            </motion.div>
          )}
          
          {gameState === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.screenContainer}
            >
              <SoundSafariLoadingScreen 
                targetSound={gameConfig.targetSound}
                difficulty={gameConfig.difficulty}
                onContinue={handleContinueFromLoading}
                round={currentRound}
                totalRounds={totalRounds}
              />
            </motion.div>
          )}
          
          {gameState === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.screenContainer}
            >
              <SoundIntroScreen 
                targetSound={gameConfig.targetSound}
                onContinue={handleContinueFromIntro}
              />
            </motion.div>
          )}
          
          {gameState === 'gameplay' && (
            <motion.div
              key="gameplay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.screenContainer}
            >
              <GameplayScreen 
                animals={roundAnimals}
                targetSound={gameConfig.targetSound}
                soundPosition={gameConfig.soundPosition}
                onSubmit={handleSubmitAnswers}
                timeLimit={DIFFICULTY_LEVELS[gameConfig.difficulty].timeLimit}
              />
            </motion.div>
          )}
          
          {gameState === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.screenContainer}
            >
              <ResultsScreen 
                results={getGameResults()}
                onNextRound={handleNextRound}
                onTryAgain={handleTryAgain}
              />
            </motion.div>
          )}
          
          {gameState === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.screenContainer}
            >
              <GameCompleteScreen 
                score={score / totalRounds}
                totalRounds={totalRounds}
                onPlayAgain={handlePlayAgain}
                onChangeDifficulty={handleChangeDifficulty}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SoundSafariGame;