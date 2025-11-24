// frontend/wildlitz/src/pages/games/soundsafari/SoundSafariGame.jsx
// UPDATED: Saves round data after each round, then complete session at end

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../../styles/games/safari/SoundSafariGame.module.css';
import backgroundMusic2 from '../../../assets/music/sound-safari-background-music-2.mp3';

// Import mascot
import WildLitzFox from '../../../assets/img/wildlitz-idle.png';

// Import components
import SoundSafariConfigScreen from './SoundSafariConfigScreen';
import SoundSafariLoadingScreen from './SoundSafariLoadingScreen';
import SoundIntroScreen from './SoundIntroScreen';
import GameplayScreen from './GameplayScreen';
import ResultsScreen from './ResultScreen';
import GameCompleteScreen from './GameCompleteScreen';

// Import API functions
import { 
  fetchSafariAnimals, 
  fetchRandomSound, 
  fetchSoundExamples,
  submitGameResults 
} from '../../../services/soundSafariApi';
import soundSafariAnalyticsService from '../../../services/soundSafariAnalyticsService';

// Import constants
import { 
  SOUND_DESCRIPTIONS, 
  SOUND_POSITIONS, 
  DIFFICULTY_LEVELS,
  ENVIRONMENTS 
} from '../../../mock/soundSafariData';

const SoundSafariGame = () => {
  // Game states
  const [gameState, setGameState] = useState('config');
  // Shared audio state for Loading and Intro screens
  const audioRef = useRef(null);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  
  // Initialize audio for Loading/Intro screens
  useEffect(() => {
    // Only play audio on loading or intro screens
    if ((gameState === 'loading' || gameState === 'intro') && audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.loop = true;
      
      const playMusic = async () => {
        try {
          await audioRef.current.play();
        } catch (error) {
          console.log('Auto-play blocked:', error);
        }
      };
      
      playMusic();
    } else if (audioRef.current && gameState !== 'loading' && gameState !== 'intro') {
      // Pause audio when leaving loading/intro screens
      audioRef.current.pause();
    }
  }, [gameState]);
  
  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);
  
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume > 0) {
      setIsMuted(false);
    }
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  const toggleVolumeControl = () => {
    setShowVolumeControl(!showVolumeControl);
  };
  
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
  
  // Keep track of used sounds
  const [soundsUsed, setSoundsUsed] = useState([]);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(Date.now());
  
  // UPDATED: Store all round data for final session save
  const [allRoundsData, setAllRoundsData] = useState([]);
  const [currentRoundData, setCurrentRoundData] = useState(null);
  const [roundStartTime, setRoundStartTime] = useState(Date.now());
  
  const [error, setError] = useState(null);
  
  // Character speech bubble
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleMessage, setBubbleMessage] = useState("");
  
  const [fromIntroScreen, setFromIntroScreen] = useState(false);
  
  /**
   * Handle starting a new game
   */
  const handleStartGame = async (config) => {
    setGameConfig(config);
    
    // Reset analytics tracking
    setSessionStartTime(Date.now());
    setAllRoundsData([]);
    setCurrentRoundData(null); // ADD THIS LINE
    setRoundStartTime(Date.now());
    
    setCurrentRound(1);
    setScore(0);
    setSoundsUsed([config.targetSound]);
    setGameState('loading');
    setFromIntroScreen(false);
    setError(null);
    
    await prepareNewRound(config.targetSound, config.difficulty, 0, []);
    
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
   * UPDATED: Store round data temporarily (don't add to array yet)
   * Will be added to allRoundsData only when "Next Round" is clicked
   */
  const saveRoundData = (correctSelections, incorrectSelections, missedCorrect) => {
    const roundTime = Math.floor((Date.now() - roundStartTime) / 1000);
    
    const roundData = soundSafariAnalyticsService.formatRoundData(
      currentRound,
      gameConfig,
      {
        correctSelections,
        incorrectSelections,
        missedCorrect,
        timeSpent: roundTime
      }
    );
    
    console.log(`📊 Round ${currentRound} data (stored temporarily):`, roundData);
    
    // Store in temporary state (don't add to array yet)
    setCurrentRoundData(roundData);
    
    // Reset round timer for potential retry
    setRoundStartTime(Date.now());
  };

   /**
   * UPDATED: Save complete session with all rounds at game end
   */
  const saveCompleteSession = async () => {
    try {
      const totalTimeSpent = Date.now() - sessionStartTime;
      
      const sessionData = soundSafariAnalyticsService.formatSessionData(
        gameConfig,
        allRoundsData,
        totalTimeSpent
      );
      
      console.log('📊 Saving complete session:', sessionData);
      console.log(`   - ${allRoundsData.length} rounds`);
      console.log(`   - Total time: ${Math.floor(totalTimeSpent / 1000)}s`);
      
      const result = await soundSafariAnalyticsService.saveGameSession(sessionData);
      
      if (result.success) {
        if (result.anonymous) {
          console.log('✅ Session saved anonymously (user not logged in)');
        } else {
          console.log('✅ Session saved successfully!');
          console.log('   Session ID:', result.session_id);
        }
      } else {
        console.error('❌ Failed to save session:', result.error);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Error saving session:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Prepare a new round
   */
  const prepareNewRound = async (targetSound = gameConfig.targetSound, difficulty = gameConfig.difficulty, retryCount = 0, triedSounds = []) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const currentTriedSounds = [...triedSounds, targetSound];
      const soundPosition = gameConfig.soundPosition;
      
      setGameConfig(prev => ({
        ...prev,
        targetSound
      }));
      
      console.log(`🎯 Fetching animals for sound "${targetSound}" at position "${soundPosition}"`);
      
      const response = await fetchSafariAnimals({
        sound: targetSound,
        difficulty: difficulty,
        environment: gameConfig.environment,
        position: soundPosition
      });
      
      if (response.animals && response.animals.length > 0) {
        setRoundAnimals(response.animals);
        console.log(`✅ Loaded ${response.animals.length} animals`);
        return;
      }
      
      console.warn(`⚠️ No animals found, retrying...`);
      
      if (retryCount < 15) {
        const allSounds = Object.keys(SOUND_DESCRIPTIONS);
        const availableSounds = allSounds.filter(sound => !currentTriedSounds.includes(sound));
        
        if (availableSounds.length > 0) {
          const newSound = availableSounds[Math.floor(Math.random() * availableSounds.length)];
          return prepareNewRound(newSound, difficulty, retryCount + 1, currentTriedSounds);
        }
      }
      
      // If all retries failed
      console.error('❌ Unable to find animals');
      setError('Unable to load animals for this round');
      
    } catch (error) {
      console.error('❌ Error preparing round:', error);
      setError(`Failed to load animals: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Select a new target sound
   */
  const selectNewTargetSound = async () => {
    try {
      const response = await fetchRandomSound();
      
      if (response.sound && !soundsUsed.includes(response.sound)) {
        setSoundsUsed(prev => [...prev, response.sound]);
        return response.sound;
      }
      
      const availableSounds = response.available_sounds || Object.keys(SOUND_DESCRIPTIONS);
      const unusedSounds = availableSounds.filter(sound => !soundsUsed.includes(sound));
      
      if (unusedSounds.length > 0) {
        const newSound = unusedSounds[Math.floor(Math.random() * unusedSounds.length)];
        setSoundsUsed(prev => [...prev, newSound]);
        return newSound;
      }
      
      setSoundsUsed([]);
      return availableSounds[Math.floor(Math.random() * availableSounds.length)];
      
    } catch (error) {
      console.error('Error getting random sound:', error);
      const fallbackSounds = Object.keys(SOUND_DESCRIPTIONS);
      return fallbackSounds[Math.floor(Math.random() * fallbackSounds.length)];
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
      case 'anywhere': return 'anywhere';
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
  /**
   * Handle submitting answers for a round
   */
  const handleSubmitAnswers = (selected) => {
    setSelectedAnimals(selected);
    
    // Get correct animals based on sound AND position
    const correctAnimals = roundAnimals.filter(animal => {
      if (animal.target_sound !== gameConfig.targetSound) {
        return false;
      }
      
      if (gameConfig.soundPosition === 'anywhere') {
        return true;
      }
      
      return animal.sound_position === gameConfig.soundPosition;
    });
    
    // Validate selected animals
    const correctSelections = selected.filter(animal => {
      if (animal.target_sound !== gameConfig.targetSound) {
        return false;
      }
      
      if (gameConfig.soundPosition === 'anywhere') {
        return true;
      }
      
      return animal.sound_position === gameConfig.soundPosition;
    }).length;
    
    const incorrectSelections = selected.length - correctSelections;
    
    const roundScore = correctAnimals.length > 0 
      ? (correctSelections / correctAnimals.length) * 100 
      : 0;
    
    setScore(prevScore => prevScore + roundScore);
    
    // Calculate missed correct animals
    const missedCorrect = correctAnimals.length - correctSelections;

    // UPDATED: Save round data immediately with missed count
    saveRoundData(correctSelections, incorrectSelections, missedCorrect);
    
    setGameState('results');
  };
  
  /**
   * UPDATED: Save current round data, then move to next round
   * Fixed: Ensures Round 5 is included in analytics
   */
  const handleNextRound = async () => {
    // Build the updated rounds array with current round data
    let updatedRoundsData = allRoundsData;
    
    if (currentRoundData) {
      console.log(`✅ Saving Round ${currentRound} data`);
      updatedRoundsData = [...allRoundsData, currentRoundData];
      setAllRoundsData(updatedRoundsData); // Update state
      setCurrentRoundData(null); // Clear temporary storage
    }
    
    // Check if game is complete
    if (currentRound >= totalRounds) {
      console.log('🎮 Game complete! Saving session with all rounds...');
      console.log(`   - Total rounds to save: ${updatedRoundsData.length}`);
      
      // Save session with the updated rounds data
      const totalTimeSpent = Date.now() - sessionStartTime;
      
      const sessionData = soundSafariAnalyticsService.formatSessionData(
        gameConfig,
        updatedRoundsData, // Use the updated array directly
        totalTimeSpent
      );
      
      console.log('📊 Saving complete session:', sessionData);
      console.log(`   - ${updatedRoundsData.length} rounds included`);
      
      const result = await soundSafariAnalyticsService.saveGameSession(sessionData);
      
      if (result.success) {
        console.log('✅ Session saved successfully with all rounds!');
      } else {
        console.error('❌ Failed to save session:', result.error);
      }
      
      setGameState('complete');
      return;
    }
    
    // Continue to next round (not the final round)
    setGameState('loading');
    setCurrentRound(prev => prev + 1);
    const newSound = await selectNewTargetSound();
    
    // Reset round timer
    setRoundStartTime(Date.now());
    
    await prepareNewRound(newSound, gameConfig.difficulty, 0, []);
    
    setTimeout(() => {
      setGameState('intro');
    }, 2000);
  };
  
  /**
   * UPDATED: Try the same round again (overwrites currentRoundData)
   */
  const handleTryAgain = async () => {
    console.log(`🔄 Trying Round ${currentRound} again (will overwrite previous attempt)`);
    
    // currentRoundData will be overwritten when they complete this retry
    // Don't clear it here - let saveRoundData overwrite it
    
    await prepareNewRound(gameConfig.targetSound, gameConfig.difficulty, 0, []);
    
    // Reset round timer
    setRoundStartTime(Date.now());
    
    setGameState('intro');
    setFromIntroScreen(false);
    
    const introMessage = `Let's try again with the "${gameConfig.targetSound}" sound. Listen and find it in animal names!`;
    setBubbleMessage(introMessage);
    setShowBubble(true);
    
    setTimeout(() => {
      setShowBubble(false);
    }, 8000);
  };
  
  /**
   * Handle playing again after game completion
   */
  const handlePlayAgain = async () => {
    // Reset everything
    setSessionStartTime(Date.now());
    setAllRoundsData([]);
    setCurrentRoundData(null); // ADD THIS LINE
    setRoundStartTime(Date.now());
    
    setCurrentRound(1);
    setScore(0);
    setFromIntroScreen(false);
    
    const newSound = await selectNewTargetSound();
    await prepareNewRound(newSound, gameConfig.difficulty, 0, []);
    
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
   * Handle changing difficulty
   */
  const handleChangeDifficulty = () => {
    setGameState('config');
    setFromIntroScreen(false);
  };
  
  /**
   * Get environment background class
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
   * Get game results for display
   */
  const getGameResults = () => {
    const correctAnimals = roundAnimals.filter(animal => {
      if (animal.target_sound !== gameConfig.targetSound) {
        return false;
      }
      
      if (gameConfig.soundPosition === 'anywhere') {
        return true;
      }
      
      return animal.sound_position === gameConfig.soundPosition;
    });
    
    const incorrectAnimals = roundAnimals.filter(animal => {
      if (animal.target_sound !== gameConfig.targetSound) {
        return true;
      }
      
      if (gameConfig.soundPosition === 'anywhere') {
        return false;
      }
      
      return animal.sound_position !== gameConfig.soundPosition;
    });
    
    return {
      correctAnimals,
      incorrectAnimals,
      selectedAnimals,
      targetSound: gameConfig.targetSound,
      soundPosition: gameConfig.soundPosition
    };
  };
  
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
      {/* Shared audio for Loading and Intro screens */}
      {(gameState === 'loading' || gameState === 'intro') && (
        <audio ref={audioRef} src={backgroundMusic2} />
      )}
      
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
                volume={volume}
                isMuted={isMuted}
                showVolumeControl={showVolumeControl}
                onVolumeChange={handleVolumeChange}
                onToggleMute={toggleMute}
                onToggleVolumeControl={toggleVolumeControl}
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
                volume={volume}
                isMuted={isMuted}
                showVolumeControl={showVolumeControl}
                onVolumeChange={handleVolumeChange}
                onToggleMute={toggleMute}
                onToggleVolumeControl={toggleVolumeControl}
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
            <GameCompleteScreen
              score={score}
              totalRounds={totalRounds}
              totalCorrect={allRoundsData.reduce((sum, round) => sum + (round.correctCount || 0), 0)}
              totalAnimalsWithSound={allRoundsData.reduce((sum, round) => sum + (round.totalCorrectAnimals || 0), 0)}
              onPlayAgain={handlePlayAgain}
              onChangeDifficulty={handleChangeDifficulty}
              gameConfig={gameConfig}
              roundsData={allRoundsData}
            />
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