// src/pages/games/vanishing/GameplayScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import styles from '../../../styles/games/vanishing/GameplayScreen.module.css';

/**
 * GameplayScreen component for the Vanishing Game
 * Shows the word that gradually fades away, challenging students to remember it
 */
const GameplayScreen = ({ wordData, config, onResult, round, totalRounds }) => {
  // Destructure word data
  const { word, pattern, patternPosition } = wordData;
  
  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(5); // Default 5 seconds
  const [vanishState, setVanishState] = useState('visible'); // visible, vanishing, vanished
  const [hasAnswered, setHasAnswered] = useState(false);
  
  // References
  const timerRef = useRef(null);
  
  // Set vanishing time based on difficulty
  useEffect(() => {
    let vanishTime = 5; // Default
    
    switch(config.difficulty) {
      case 'easy':
        vanishTime = 5;
        break;
      case 'medium':
        vanishTime = 4;
        break;
      case 'hard':
        vanishTime = 3;
        break;
      default:
        vanishTime = 5;
    }
    
    setTimeRemaining(vanishTime);
    
    // Start countdown after a brief delay
    const initialDelay = setTimeout(() => {
      startVanishingTimer();
    }, 2000);
    
    return () => {
      clearTimeout(initialDelay);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [config.difficulty, word]);
  
  // Start the vanishing timer
  const startVanishingTimer = () => {
    setVanishState('vanishing');
    
    // Start countdown
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setVanishState('vanished');
          setTimeRemaining(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  // Handle user response
  const handleUserResponse = (recognized) => {
    if (hasAnswered) return;
    
    // Clear timer
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Set answered flag
    setHasAnswered(true);
    
    // Report result to parent
    setTimeout(() => {
      onResult(recognized, word);
    }, 500);
  };
  
  // Handle user indicating they recognize the word
  const handleRecognized = () => {
    handleUserResponse(true);
  };
  
  // Handle user indicating they don't recognize the word
  const handleNotRecognized = () => {
    handleUserResponse(false);
  };
  
  // Handle showing the word (giving up)
  const handleShowWord = () => {
    setVanishState('visible');
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeout(() => {
      handleUserResponse(false);
    }, 1500);
  };
  
  // Get the opacity level for the vanishing effect
  const getVanishingOpacity = () => {
    if (vanishState === 'visible') return 1;
    if (vanishState === 'vanished') return 0;
    
    // Calculate opacity based on remaining time
    const maxTime = config.difficulty === 'easy' ? 5 : config.difficulty === 'medium' ? 4 : 3;
    return timeRemaining / maxTime;
  };
  
  // Helper to render word with highlighted pattern
  const renderWordWithHighlight = () => {
    if (!config.highlightTarget || !pattern || pattern.length === 0) {
      return <span>{word}</span>;
    }
    
    const patternIndex = word.toLowerCase().indexOf(pattern.toLowerCase());
    
    if (patternIndex === -1) {
      return <span>{word}</span>;
    }
    
    const beforePattern = word.substring(0, patternIndex);
    const patternText = word.substring(patternIndex, patternIndex + pattern.length);
    const afterPattern = word.substring(patternIndex + pattern.length);
    
    return (
      <>
        <span>{beforePattern}</span>
        <span className={styles.highlightedPattern}>{patternText}</span>
        <span>{afterPattern}</span>
      </>
    );
  };
  
  return (
    <div className={styles.gameplayContainer}>
      <div className={styles.gameplayCard}>
        <div className={styles.gameHeader}>
          <div className={styles.gameInfo}>
            <h2 className={styles.gameTitle}>
              Simple Words - {config.learningFocus.replace('_', ' ')}
            </h2>
            <p className={styles.vanishingWarning}>
              Quick! Read before it vanishes!
            </p>
          </div>
        </div>
        
        {/* Vanishing timer bar */}
        <div className={styles.timerBarContainer}>
          <motion.div 
            className={styles.timerBar}
            initial={{ width: '100%' }}
            animate={{ 
              width: `${(timeRemaining / 5) * 100}%`,
              backgroundColor: timeRemaining < 2 ? '#f44336' : '#ff9800'
            }}
            transition={{ duration: 0.5 }}
          />
        </div>
        
        {/* Word display area */}
        <div className={styles.wordDisplayArea}>
          <div className={styles.wordContainer}>
            <motion.div 
              className={styles.wordCard}
              animate={{ 
                opacity: getVanishingOpacity(),
              }}
              transition={{ duration: 0.5 }}
            >
              <div className={styles.wordText}>
                {renderWordWithHighlight()}
              </div>
            </motion.div>
          </div>
          
          {/* Time left indicator */}
          <div className={styles.timeLeftIndicator}>
            {timeRemaining > 0 && (
              <motion.div 
                className={styles.timeLeftBadge}
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                {timeRemaining}s left
              </motion.div>
            )}
          </div>
          
          {/* Word recognition prompt */}
          <div className={styles.wordPrompt}>
            {vanishState === 'vanished' ? "What was the word?" : "Do you recognize this word?"}
          </div>
        </div>
        
        {/* Control buttons */}
        <div className={styles.controlButtonsContainer}>
          <div className={styles.controlButtons}>
            <motion.button 
              className={styles.controlButton}
              onClick={() => {
                if (timerRef.current) clearInterval(timerRef.current);
                setVanishState(prev => prev === 'vanishing' ? 'visible' : 'vanishing');
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {vanishState === 'vanishing' ? "⏸️" : "▶️"}
            </motion.button>
            
            <motion.button 
              className={styles.controlButton}
              onClick={handleShowWord}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              👁️
            </motion.button>
            
            <motion.button 
              className={styles.responseButton}
              onClick={handleRecognized}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              I know it!
            </motion.button>
            
            <motion.button 
              className={`${styles.responseButton} ${styles.secondaryButton}`}
              onClick={handleNotRecognized}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Show me
            </motion.button>
          </div>
        </div>
        
        {/* Game settings info */}
        <div className={styles.gameSettings}>
          <span>Vanishing Settings: {config.vanishSpeed === 'slow' ? 'Slow' : config.vanishSpeed === 'fast' ? 'Fast' : 'Normal'} | {config.highlightTarget ? 'Highlighted Elements' : 'No Highlighting'} | {config.difficulty} Mode</span>
        </div>
      </div>
    </div>
  );
};

export default GameplayScreen;