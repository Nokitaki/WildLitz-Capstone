// src/pages/games/soundsafari/SoundSafariGame.jsx <updated on 2025-05-16>

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

// Import API functions instead of mock data
import { 
  fetchSafariAnimals, 
  fetchRandomSound, 
  fetchSoundExamples,
  submitGameResults 
} from '../../../services/soundSafariApi';
import soundSafariAnalyticsService from '../../../services/soundSafariAnalyticsService';

// Import only necessary constants for UI
import { 
  SOUND_DESCRIPTIONS, 
  SOUND_POSITIONS, 
  DIFFICULTY_LEVELS,
  ENVIRONMENTS 
} from '../../../mock/soundSafariData';

/**
 * Main Sound Safari Game component that manages game state and flow
 * Updated to use Supabase data instead of mock data
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
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(Date.now());
  const [roundResults, setRoundResults] = useState([]);
  const [error, setError] = useState(null);
  
  // Character speech bubble
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleMessage, setBubbleMessage] = useState("");
  
  // Track if this is coming from SoundIntroScreen (to avoid duplicate speech)
  const [fromIntroScreen, setFromIntroScreen] = useState(false);
  
  /**
   * Handle starting a new game with the given configuration
   */
const handleStartGame = async (config) => {
  setGameConfig(config);
  
  // 🆕 Reset analytics tracking for new game
  setSessionStartTime(Date.now());
  setRoundResults([]);
  
  setCurrentRound(1);
  setScore(0);
  setSoundsUsed([config.targetSound]);
  setGameState('loading');
  setFromIntroScreen(false);
  setError(null);
  
  await prepareNewRound(config.targetSound, config.difficulty);
  
  setTimeout(() => {
    setGameState('intro');
    const introMessage = `Today we're learning about the "${config.targetSound}" sound. Listen and find it in animal names!`;
    setBubbleMessage(introMessage);
    setShowBubble(true);
    
    setTimeout(() => {
      setShowBubble(false);
    }, 8000);
  }, 2000);
};
  
  /**
   * Prepare a new round of the game using Supabase data
   */
  /**
 * Save game session analytics to database
 * Called when all rounds are completed
 */
  const saveGameSession = async () => {
    try {
      // Calculate totals from all rounds
      const totalAnimals = roundResults.reduce((sum, r) => sum + r.animalsShown, 0);
      const totalCorrect = roundResults.reduce((sum, r) => sum + r.correctSelections, 0);
      const totalIncorrect = roundResults.reduce((sum, r) => sum + r.incorrectSelections, 0);
      
      const timeSpent = Math.floor((Date.now() - sessionStartTime) / 1000);
      const successRate = totalAnimals > 0 
        ? parseFloat(((totalCorrect / totalAnimals) * 100).toFixed(2))
        : 0;
      
      const sessionData = {
        timestamp: new Date().toISOString(),
        target_sound: gameConfig.targetSound,
        sound_position: gameConfig.soundPosition,
        environment: gameConfig.environment,
        difficulty: gameConfig.difficulty,
        animals_shown: totalAnimals,
        correct_selections: totalCorrect,
        incorrect_selections: totalIncorrect,
        success_rate: successRate,
        time_spent: timeSpent,
        completed: true
      };
      
      console.log('📊 Saving Sound Safari session:', sessionData);
      
      const result = await soundSafariAnalyticsService.saveGameSession(sessionData);
      
      if (result.success) {
        console.log('✅ Session saved successfully!', result.session_id);
      } else {
        console.error('❌ Failed to save session:', result.error);
        // Don't block game completion even if save fails
      }
      
    } catch (error) {
      console.error('❌ Error saving session:', error);
      // Don't block game completion even if save fails
    }
  };

  const prepareNewRound = async (targetSound = gameConfig.targetSound, difficulty = gameConfig.difficulty) => {
    setIsLoading(true);
    setError(null);
    
    try {
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
      
      // Fetch animals from Supabase
      const response = await fetchSafariAnimals({
        sound: targetSound,
        difficulty: difficulty,
        environment: gameConfig.environment,
        position: soundPosition
      });
      
      if (response.animals && response.animals.length > 0) {
        setRoundAnimals(response.animals);
      } else {
        throw new Error('No animals found for the specified criteria');
      }
      
    } catch (error) {
      console.error('Error preparing round:', error);
      setError(`Failed to load animals: ${error.message}`);
      
      // Fallback: show error message or retry
      setBubbleMessage(`Sorry, there was an error loading the animals. Please try again.`);
      setShowBubble(true);
      
      setTimeout(() => {
        setShowBubble(false);
        setGameState('config'); // Go back to config screen
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Select a new target sound for the next round
   */
  const selectNewTargetSound = async () => {
    try {
      // Try to get a random sound from the API
      const response = await fetchRandomSound();
      
      if (response.sound && !soundsUsed.includes(response.sound)) {
        setSoundsUsed(prev => [...prev, response.sound]);
        return response.sound;
      }
      
      // If API sound was already used, get available sounds from the list
      const availableSounds = response.available_sounds || Object.keys(SOUND_DESCRIPTIONS);
      const unusedSounds = availableSounds.filter(sound => !soundsUsed.includes(sound));
      
      if (unusedSounds.length > 0) {
        const newSound = unusedSounds[Math.floor(Math.random() * unusedSounds.length)];
        setSoundsUsed(prev => [...prev, newSound]);
        return newSound;
      }
      
      // If all sounds used, reset and pick a random one
      const newSound = availableSounds[Math.floor(Math.random() * availableSounds.length)];
      setSoundsUsed([newSound]);
      return newSound;
      
    } catch (error) {
      console.error('Error selecting new sound:', error);
      
      // Fallback to local sound selection
      const allSounds = Object.keys(SOUND_DESCRIPTIONS);
      const availableSounds = allSounds.filter(sound => !soundsUsed.includes(sound));
      
      if (availableSounds.length > 0) {
        const newSound = availableSounds[Math.floor(Math.random() * availableSounds.length)];
        setSoundsUsed(prev => [...prev, newSound]);
        return newSound;
      }
      
      // Reset if all sounds used
      const newSound = allSounds[Math.floor(Math.random() * allSounds.length)];
      setSoundsUsed([newSound]);
      return newSound;
    }
  };
  
  /**
   * Handle continuing from intro to gameplay
   */
  const handleContinueFromIntro = () => {
    setFromIntroScreen(true); // Set flag to indicate coming from intro screen
    setGameState('gameplay');
    
    // Get position text
    const positionText = getPositionText();
    
    // Set gameplay instruction in the bubble
    setBubbleMessage(`Find animals with the "${gameConfig.targetSound}" sound ${positionText} of their names!`);
    setShowBubble(true);
    
    // Hide the bubble after 5 seconds
    setTimeout(() => {
      setShowBubble(false);
    }, 5000);
  };
  
  // Get position text
  const getPositionText = () => {
    switch(gameConfig.soundPosition) {
      case 'beginning': return 'at the beginning';
      case 'middle': return 'in the middle';
      case 'ending': return 'at the end';
      default: return 'anywhere';
    }
  };
  
  /**
   * Handle continuing from loading to intro
   */
  const handleContinueFromLoading = () => {
    setGameState('intro');
    setFromIntroScreen(false);
    
    // Show introduction message in the bubble
    const introMessage = `Today we're learning about the "${gameConfig.targetSound}" sound. Listen and find it in animal names!`;
    setBubbleMessage(introMessage);
    setShowBubble(true);
    
    // Hide the bubble after 8 seconds
    setTimeout(() => {
      setShowBubble(false);
    }, 8000);
  };
  
  /**
   * Handle submitting answers
    */
  const handleSubmitAnswers = (selected) => {
    setSelectedAnimals(selected);
    
    // Calculate correct and incorrect
    const correctAnimals = roundAnimals.filter(animal => 
      animal.hasSound === gameConfig.targetSound
    );
    
    const correctSelections = selected.filter(animal => 
      animal.hasSound === gameConfig.targetSound
    ).length;
    
    const incorrectSelections = selected.length - correctSelections;
    
    // Calculate round score
    const roundScore = (correctSelections / correctAnimals.length) * 100;
    setScore(prevScore => prevScore + roundScore);
    
    // 🆕 Track this round's results for analytics
    setRoundResults(prev => [...prev, {
      round: currentRound,
      animalsShown: roundAnimals.length,
      correctSelections: correctSelections,
      incorrectSelections: incorrectSelections,
      roundScore: roundScore
    }]);
    
    setGameState('results');
  };
  
  /**
   * Handle moving to next round
   */
/**
 * Save game session analytics to database
 * Called when all rounds are completed
 */

const handleNextRound = async () => {
  // Check if game is complete (all rounds finished)
  if (currentRound >= totalRounds) {
    console.log('🎮 Game complete! Saving analytics...');
    await saveGameSession(); // ✅ Save analytics before showing complete screen
    setGameState('complete');
    return;
  }
  
  // Continue to next round
  setCurrentRound(prev => prev + 1);
  const newSound = await selectNewTargetSound();
  await prepareNewRound(newSound, gameConfig.difficulty);
  
  setGameState('loading');
  
  setTimeout(() => {
    setGameState('intro');
  }, 2000);
};
  
  /**
   * Handle trying the same round again
   */
  const handleTryAgain = async () => {
    // Re-fetch animals for the same round
    await prepareNewRound(gameConfig.targetSound, gameConfig.difficulty);
    
    setGameState('intro');
    setFromIntroScreen(false);
    
    // Show introduction message in the bubble again
    const introMessage = `Let's try again with the "${gameConfig.targetSound}" sound. Listen and find it in animal names!`;
    setBubbleMessage(introMessage);
    setShowBubble(true);
    
    // Hide the bubble after 8 seconds
    setTimeout(() => {
      setShowBubble(false);
    }, 8000);
  };
  
  /**
   * Handle playing again after game completion
   */
  const handlePlayAgain = async () => {
  // 🆕 Reset analytics tracking for new game
  setSessionStartTime(Date.now());
  setRoundResults([]);
  
  setCurrentRound(1);
  setScore(0);
  setFromIntroScreen(false);
  
  const newSound = await selectNewTargetSound();
  await prepareNewRound(newSound, gameConfig.difficulty);
  
  setGameState('loading');
  
  setTimeout(() => {
    setGameState('intro');
    const introMessage = `Welcome back! Today we're learning about the "${newSound}" sound. Listen and find it in animal names!`;
    setBubbleMessage(introMessage);
    setShowBubble(true);
    
    setTimeout(() => {
      setShowBubble(false);
    }, 8000);
  }, 2000);
};
  
  /**
   * Handle changing difficulty after game completion
   */
  const handleChangeDifficulty = () => {
    // Reset to config screen
    setGameState('config');
    setFromIntroScreen(false);
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
  
  /** REMOVED FOR NOW [DONT CHANGE!!]
   * Render the progress indicator
   
  const renderProgressIndicator = () => {
    if (gameState === 'config') return null;
    
    return (
      <div className={styles.progressIndicator}>
        <div className={styles.progressLabel}>
          <div className={styles.progressNumbers}>
            {currentRound}/{totalRounds}
          </div>
          <div>Round</div>
        </div>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill}
            style={{ width: `${(currentRound / totalRounds) * 100}%` }}
          />
        </div>
      </div>
    );
  };

  */

  /**
   * Determine if the mascot should be shown
   */
  const shouldShowMascot = () => {
    return gameState === 'intro' || gameState === 'gameplay';
  };
  
  // Show loading state if fetching data
  if (isLoading && gameState === 'config') {
    return (
      <div className={`${styles.gameContainer} ${getEnvironmentClass()}`}>
        <div className={styles.gameContent}>
          <div style={{ 
            color: 'white', 
            fontSize: '1.5rem', 
            textAlign: 'center' 
          }}>
            Loading game...
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`${styles.gameContainer} ${getEnvironmentClass()}`}>
      <div className={styles.gameContent}>
     
        
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
          
          {gameState === 'gameplay' && roundAnimals.length > 0 && (
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
                skipIntro={!fromIntroScreen} // Skip the intro if NOT coming from intro screen
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
        
        {/* Show error message if there's an error */}
        {error && (
          <motion.div
            className={styles.errorOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(255, 255, 255, 0.95)',
              padding: '20px',
              borderRadius: '10px',
              textAlign: 'center',
              maxWidth: '400px',
              zIndex: 1000
            }}
          >
            <h3 style={{ color: '#f44336', margin: '0 0 10px 0' }}>Error</h3>
            <p style={{ color: '#333', margin: '0 0 15px 0' }}>{error}</p>
            <button
              onClick={() => {
                setError(null);
                setGameState('config');
              }}
              style={{
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Try Again
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SoundSafariGame;