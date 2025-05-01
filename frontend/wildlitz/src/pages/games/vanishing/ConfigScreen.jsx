// src/pages/games/vanishing/ConfigScreen.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from '../../../styles/games/vanishing/ConfigScreen.module.css';

/**
 * Configuration screen for the Vanishing Game
 * Allows selecting challenge level, learning focus, and difficulty
 */
const ConfigScreen = ({ onStartGame }) => {
  // Game configuration state
  const [challengeLevel, setChallengeLevel] = useState('simple_words');
  const [learningFocus, setLearningFocus] = useState('short_vowels');
  const [difficulty, setDifficulty] = useState('easy');
  const [highlightTarget, setHighlightTarget] = useState(true);
  const [vanishSpeed, setVanishSpeed] = useState('normal');
  
  // Example words state - displayed based on selection
  const [exampleWords, setExampleWords] = useState([]);
  
  // Update example words when learning focus changes
  useEffect(() => {
    // In a real app, this would come from a database or API
    const examples = {
      short_vowels: ['Hop', 'Cat', 'Bed', 'Sun'],
      long_vowels: ['Meet', 'Cake', 'Bike', 'Hope'],
      blends: ['Stop', 'Flag', 'Bring', 'Clap'],
      digraphs: ['Ship', 'Chat', 'This', 'When']
    };
    
    setExampleWords(examples[learningFocus] || []);
  }, [learningFocus]);
  
  // Handle quick start with default settings
  const handleQuickStart = () => {
    const config = {
      challengeLevel: 'simple_words',
      learningFocus: 'short_vowels',
      difficulty: 'easy',
      highlightTarget: true,
      vanishSpeed: 'normal'
    };
    
    if (onStartGame) {
      onStartGame(config);
    }
  };
  
  // Handle start game with custom settings
  const handleStartGame = () => {
    const config = {
      challengeLevel,
      learningFocus,
      difficulty,
      highlightTarget,
      vanishSpeed
    };
    
    if (onStartGame) {
      onStartGame(config);
    }
  };
  
  // Get the learning focus display name
  const getLearningFocusName = (focus) => {
    const names = {
      short_vowels: 'Short Vowels',
      long_vowels: 'Long Vowels',
      blends: 'Blends',
      digraphs: 'Digraphs'
    };
    
    return names[focus] || focus;
  };
  
  // Get the challenge level display name
  const getChallengeLevelName = (level) => {
    const names = {
      simple_words: 'Simple Words',
      compound_words: 'Compound Words',
      phrases: 'Phrases',
      simple_sentences: 'Simple Sentences'
    };
    
    return names[level] || level;
  };
  
  return (
    <div className={styles.configContainer}>
      <div className={styles.configCard}>
        {/* Game header */}
        <div className={styles.gameHeader}>
          <h1 className={styles.gameTitle}>WildLitz - Enhanced Vanishing Game</h1>
          <p className={styles.gameSubtitle}>Read the content before it disappears!</p>
        </div>
        
        {/* Quick start button */}
        <div className={styles.quickStartContainer}>
          <motion.button 
            className={styles.quickStartButton}
            onClick={handleQuickStart}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Quick Start
          </motion.button>
        </div>
        
        {/* Configuration steps */}
        <div className={styles.configSteps}>
          {/* Step 1: Challenge Level */}
          <div className={styles.configStep}>
            <h3 className={styles.stepTitle}>Step 1: Select Challenge Level:</h3>
            <div className={styles.optionsGrid}>
              <motion.button 
                className={`${styles.optionButton} ${challengeLevel === 'simple_words' ? styles.selected : ''}`}
                onClick={() => setChallengeLevel('simple_words')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Simple Words
              </motion.button>
              
              <motion.button 
                className={`${styles.optionButton} ${challengeLevel === 'compound_words' ? styles.selected : ''}`}
                onClick={() => setChallengeLevel('compound_words')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Compound Words
              </motion.button>
              
              <motion.button 
                className={`${styles.optionButton} ${challengeLevel === 'phrases' ? styles.selected : ''}`}
                onClick={() => setChallengeLevel('phrases')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Phrases
              </motion.button>
              
              <motion.button 
                className={`${styles.optionButton} ${challengeLevel === 'simple_sentences' ? styles.selected : ''}`}
                onClick={() => setChallengeLevel('simple_sentences')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Simple Sentences
              </motion.button>
            </div>
          </div>
          
          {/* Step 2: Learning Focus */}
          <div className={styles.configStep}>
            <h3 className={styles.stepTitle}>Step 2: Select Learning Focus:</h3>
            <div className={styles.optionsGrid}>
              <motion.button 
                className={`${styles.optionButton} ${learningFocus === 'short_vowels' ? styles.selected : ''}`}
                onClick={() => setLearningFocus('short_vowels')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Short Vowels
              </motion.button>
              
              <motion.button 
                className={`${styles.optionButton} ${learningFocus === 'long_vowels' ? styles.selected : ''}`}
                onClick={() => setLearningFocus('long_vowels')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Long Vowels
              </motion.button>
              
              <motion.button 
                className={`${styles.optionButton} ${learningFocus === 'blends' ? styles.selected : ''}`}
                onClick={() => setLearningFocus('blends')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Blends
              </motion.button>
              
              <motion.button 
                className={`${styles.optionButton} ${learningFocus === 'digraphs' ? styles.selected : ''}`}
                onClick={() => setLearningFocus('digraphs')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Digraphs
              </motion.button>
            </div>
            
            {/* Examples of current selection */}
            <div className={styles.examplesBox}>
              <div className={styles.examplesTitle}>
                Examples Words: 
              </div>
              <div className={styles.examplesContent}>
                {exampleWords.join(', ')}
                {learningFocus === 'short_vowels' && ' (with highlighted short vowels)'}
              </div>
            </div>
          </div>
          
          {/* Step 3: Difficulty */}
          <div className={styles.configStep}>
            <h3 className={styles.stepTitle}>Step 3: Difficulty:</h3>
            <div className={styles.difficultyButtonsContainer}>
              <motion.button 
                className={`${styles.difficultyButton} ${difficulty === 'easy' ? styles.selected : ''}`}
                onClick={() => setDifficulty('easy')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Easy
              </motion.button>
              
              <motion.button 
                className={`${styles.difficultyButton} ${difficulty === 'medium' ? styles.selected : ''}`}
                onClick={() => setDifficulty('medium')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Medium
              </motion.button>
              
              <motion.button 
                className={`${styles.difficultyButton} ${difficulty === 'hard' ? styles.selected : ''}`}
                onClick={() => setDifficulty('hard')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Hard
              </motion.button>
              
              <motion.button 
                className={styles.advancedOptionsButton}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  // Toggle options visibility in a real app
                }}
              >
                Advanced options +
              </motion.button>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className={styles.actionButtons}>
            <motion.button 
              className={styles.backButton}
              onClick={() => {
                // Handle back action in real app
                window.history.back();
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Back
            </motion.button>
            
            <motion.button 
              className={styles.startButton}
              onClick={handleStartGame}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Begin Game
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigScreen;