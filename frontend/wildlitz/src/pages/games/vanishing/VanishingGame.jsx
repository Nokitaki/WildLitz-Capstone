// src/pages/games/vanishing/VanishingGame.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../../styles/games/vanishing/VanishingGame.module.css';

// Import game screens
import ConfigScreen from './ConfigScreen';
import GameplayScreen from './GameplayScreen';
import FeedbackScreen from './FeedbackScreen';
import GameCompleteScreen from './GameCompleteScreen';

// Import mascot
import WildLitzFox from '../../../assets/img/wildlitz-idle.png';

// Import mock data for development
import { WORD_SETS, PHONICS_PATTERNS } from '../../../mock/vanishingGameData';

/**
 * Main Vanishing Game component that manages game state and flow
 */
const VanishingGame = () => {
  // Game states: 'config', 'gameplay', 'feedback', 'complete'
  const [gameState, setGameState] = useState('config');
  
  // Game configuration
  const [gameConfig, setGameConfig] = useState({
    challengeLevel: 'simple_words', // simple_words, compound_words, phrases, sentences
    learningFocus: 'short_vowels', // short_vowels, long_vowels, blends, digraphs
    difficulty: 'easy', // easy, medium, hard
    highlightTarget: true,
    vanishSpeed: 'normal'
  });
  
  // Game progress
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(10);
  const [score, setScore] = useState(0);
  const [wordData, setWordData] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  
  // Character speech bubble
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleMessage, setBubbleMessage] = useState("");
  
  // Stats tracking
  const [gameStats, setGameStats] = useState({
    wordsAttempted: 0,
    wordsRecognized: 0,
    successRate: 0,
    patternStats: {}
  });

  /**
   * Handle starting a new game with the given configuration
   */
  const handleStartGame = (config) => {
    setGameConfig(config);
    setCurrentRound(1);
    setScore(0);
    setCurrentWordIndex(0);
    
    // Fetch appropriate words based on config
    const words = getWordsForConfig(config);
    setWordData(words);
    setTotalRounds(Math.min(words.length, 10)); // Limit to 10 rounds max
    
    // Initialize stats
    setGameStats({
      wordsAttempted: 0,
      wordsRecognized: 0,
      successRate: 0,
      patternStats: {
        [config.learningFocus]: { attempted: 0, correct: 0 }
      }
    });
    
    // Move to gameplay state
    setGameState('gameplay');
    
    // Show welcome message
    setBubbleMessage("Ready to practice reading? Try to remember the words before they vanish!");
    setShowBubble(true);
    
    // Hide bubble after 5 seconds
    setTimeout(() => {
      setShowBubble(false);
    }, 5000);
  };

  /**
   * Get appropriate words based on game configuration
   */
  const getWordsForConfig = (config) => {
    // In a real app, this would fetch from a database or API
    // For now, use mock data
    const { challengeLevel, learningFocus } = config;
    
    if (WORD_SETS[challengeLevel] && WORD_SETS[challengeLevel][learningFocus]) {
      // Return a copy of the array to avoid mutations
      return [...WORD_SETS[challengeLevel][learningFocus]];
    }
    
    // Fallback to simple words with short vowels
    return [...WORD_SETS.simple_words.short_vowels];
  };

  /**
   * Handle word recognition result
   */
  const handleWordResult = (recognized, word) => {
    // Update stats
    const newStats = {...gameStats};
    newStats.wordsAttempted++;
    
    if (recognized) {
      newStats.wordsRecognized++;
      setScore(prevScore => prevScore + 1);
      
      // Update pattern stats
      if (!newStats.patternStats[gameConfig.learningFocus]) {
        newStats.patternStats[gameConfig.learningFocus] = { attempted: 0, correct: 0 };
      }
      newStats.patternStats[gameConfig.learningFocus].attempted++;
      newStats.patternStats[gameConfig.learningFocus].correct++;
    } else {
      // Update pattern stats (attempted but not correct)
      if (!newStats.patternStats[gameConfig.learningFocus]) {
        newStats.patternStats[gameConfig.learningFocus] = { attempted: 0, correct: 0 };
      }
      newStats.patternStats[gameConfig.learningFocus].attempted++;
    }
    
    // Calculate success rate
    newStats.successRate = Math.round((newStats.wordsRecognized / newStats.wordsAttempted) * 100);
    
    setGameStats(newStats);
    
    // Show feedback based on result
    setGameState('feedback');
    
    const feedbackMessage = recognized 
      ? "Great job! You remembered the word correctly!" 
      : "Keep trying! Practice helps your brain remember words better.";
    
    setBubbleMessage(feedbackMessage);
    setShowBubble(true);
    
    // Hide bubble after 3 seconds
    setTimeout(() => {
      setShowBubble(false);
    }, 3000);
  };

  /**
   * Handle moving to next word
   */
  const handleNextWord = () => {
    if (currentWordIndex >= wordData.length - 1 || currentWordIndex >= totalRounds - 1) {
      // End of game
      setGameState('complete');
    } else {
      // Move to next word
      setCurrentWordIndex(prevIndex => prevIndex + 1);
      setCurrentRound(prevRound => prevRound + 1);
      setGameState('gameplay');
    }
  };

  /**
   * Handle retrying current word
   */
  const handleRetryWord = () => {
    setGameState('gameplay');
  };

  /**
   * Handle playing the game again
   */
  const handlePlayAgain = () => {
    setGameState('config');
  };

  /**
   * Determine if the mascot should be shown
   */
  const shouldShowMascot = () => {
    return gameState !== 'config';
  };

  /**
   * Render the current word for gameplay
   */
  const getCurrentWord = () => {
    if (wordData.length === 0 || currentWordIndex >= wordData.length) {
      return { word: '', pattern: '', patternPosition: '' };
    }
    
    return wordData[currentWordIndex];
  };

  return (
    <div className={styles.gameContainer}>
      <div className={styles.gameContent}>
        {/* Progress indicator */}
        {gameState !== 'config' && (
          <div className={styles.progressIndicator}>
            <div className={styles.progressLabel}>
              <span>Word</span>
              <div className={styles.progressNumbers}>
                {currentRound}/{totalRounds}
              </div>
            </div>
            <div className={styles.progressBar}>
              <motion.div 
                className={styles.progressFill}
                initial={{ width: "0%" }}
                animate={{ 
                  width: `${(currentRound / totalRounds) * 100}%` 
                }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}
        
        {/* Add Fox Mascot */}
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
              <ConfigScreen onStartGame={handleStartGame} />
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
                wordData={getCurrentWord()}
                config={gameConfig}
                onResult={handleWordResult}
                round={currentRound}
                totalRounds={totalRounds}
              />
            </motion.div>
          )}
          
          {gameState === 'feedback' && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.screenContainer}
            >
              <FeedbackScreen 
                wordData={getCurrentWord()}
                config={gameConfig}
                onNextWord={handleNextWord}
                onRetry={handleRetryWord}
                success={gameStats.wordsAttempted === gameStats.wordsRecognized}
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
                stats={gameStats}
                config={gameConfig}
                score={score}
                totalWords={totalRounds}
                onPlayAgain={handlePlayAgain}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VanishingGame;