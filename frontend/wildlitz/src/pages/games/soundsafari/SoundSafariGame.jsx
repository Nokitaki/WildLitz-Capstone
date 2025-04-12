import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Character from '../../../assets/img/wildlitz-idle.png';

// Import components and styles
import SoundSafariConfigScreen from '../../../configs/SoundSafariConfigScreen';
import SoundSafariLoadingScreen from './SoundSafariLoadingScreen';
import { 
  SoundIntroScreen, 
  GameplayScreen, 
  ResultsScreen, 
  GameCompleteScreen 
} from './SoundSafariComponents';
import styles from '../../../styles/SoundSafariGame.module.css';

// Import mock data
import { 
  ANIMALS_DATA, 
  SOUND_DESCRIPTIONS, 
  SOUND_POSITIONS, 
  DIFFICULTY_LEVELS 
} from '../../../mock/soundSafariData';

/**
 * Main Sound Safari Game component that manages game state and flow
 */
const SoundSafariGame = () => {
  // Game states: 'config', 'loading', 'intro', 'playing', 'results', 'complete'
  const [gameState, setGameState] = useState('config');
  
  // Game configuration
  const [gameConfig, setGameConfig] = useState({
    difficulty: 'easy',
    targetSound: 's',
    soundPosition: SOUND_POSITIONS.beginning,
    playMode: 'solo',
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
    setGameState('playing');
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
    // Cycle through difficulties
    const difficulties = ['easy', 'medium', 'hard'];
    const currentIndex = difficulties.indexOf(gameConfig.difficulty);
    const newDifficulty = difficulties[(currentIndex + 1) % difficulties.length];
    
    // Update game config
    setGameConfig(prev => ({
      ...prev,
      difficulty: newDifficulty
    }));
    
    // Reset game state
    setCurrentRound(1);
    setScore(0);
    setSoundsUsed([]);
    
    // Go back to config screen
    setGameState('config');
  };
  
  // Calculate which animals were correct and incorrect for the results screen
  const correctAnimals = roundAnimals.filter(animal => animal.hasSound === gameConfig.targetSound);
  const incorrectAnimals = roundAnimals.filter(animal => animal.hasSound !== gameConfig.targetSound);
  
  return (
    <div className={styles.gameContainer}>
      <header className={styles.gameHeader}>
        <h1>WildLitz - Sound Safari Adventure</h1>
        {gameState !== 'config' && (
          <div className={styles.gameInfo}>
            <div className={styles.targetSoundBadge}>
              Target Sound: {gameConfig.targetSound}
            </div>
            <div className={styles.roundInfo}>
              Round {currentRound}/{totalRounds}
            </div>
          </div>
        )}
      </header>
      
      <AnimatePresence mode="wait">
        {gameState === 'config' && (
          <motion.div
            key="config"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <SoundSafariConfigScreen 
              onStartGame={handleStartGame}
            />
          </motion.div>
        )}
        
        {gameState === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
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
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <SoundIntroScreen 
              targetSound={gameConfig.targetSound}
              onContinue={handleContinueFromIntro}
            />
          </motion.div>
        )}
        
        {gameState === 'playing' && (
          <motion.div
            key="playing"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
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
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <ResultsScreen 
              selectedAnimals={selectedAnimals}
              correctAnimals={correctAnimals}
              incorrectAnimals={incorrectAnimals}
              targetSound={gameConfig.targetSound}
              onNextRound={handleNextRound}
              onTryAgain={handleTryAgain}
            />
          </motion.div>
        )}
        
        {gameState === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <GameCompleteScreen 
              score={score}
              totalRounds={totalRounds}
              onPlayAgain={handlePlayAgain}
              onChangeDifficulty={handleChangeDifficulty}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className={styles.mascot}>
        <img 
          src={Character}
          alt="WildLitz Fox" 
          className={styles.mascotImage}
        />
      </div>
    </div>
  );
};

export default SoundSafariGame;