import React, { useState } from 'react';
import { motion } from 'framer-motion';
import styles from '../styles/VanishingGame.module.css';

const VanishingGameConfigScreen = ({ onStartGame }) => {
  // Game configuration state
  const [challengeLevel, setChallengeLevel] = useState('simple-words');
  const [learningFocus, setLearningFocus] = useState('short-vowels');
  const [difficulty, setDifficulty] = useState('easy');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  // Example words based on learning focus
  const exampleWords = {
    'short-vowels': 'Hop, Cat, Bed, Sun',
    'long-vowels': 'Cake, Bike, Hope, Cute',
    'blends': 'Stop, Frog, Slide, Clap',
    'digraphs': 'Ship, Chat, This, When'
  };
  
  // Handle challenge level selection
  const handleChallengeLevelChange = (level) => {
    setChallengeLevel(level);
  };
  
  // Handle learning focus selection
  const handleLearningFocusChange = (focus) => {
    setLearningFocus(focus);
  };
  
  // Handle difficulty selection
  const handleDifficultyChange = (level) => {
    setDifficulty(level);
  };
  
  // Handle quick start button
  const handleQuickStart = () => {
    // Set some default values and start the game
    const quickConfig = {
      challengeLevel: 'simple-words',
      learningFocus: 'short-vowels',
      difficulty: 'medium'
    };
    
    if (onStartGame) {
      onStartGame(quickConfig);
    }
  };
  
  // Handle begin game
  const handleBeginGame = () => {
    const gameConfig = {
      challengeLevel,
      learningFocus,
      difficulty,
      advancedOptions: showAdvancedOptions ? {
        // Include any advanced options here
        fadeSpeed: 'normal',
        allowHints: true,
        wordCount: 10
      } : null
    };
    
    if (onStartGame) {
      onStartGame(gameConfig);
    }
  };
  
  // Handle back button
  const handleBack = () => {
    // In a real implementation, this would navigate back
    window.history.back();
  };
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>WildLitz - Enhanced Vanishing Game</h1>
        <p>Read the content before it disappears!</p>
      </div>
      
      <div className={styles.configContent}>
        <button 
          className={styles.quickStartButton}
          onClick={handleQuickStart}
        >
          Quick Start
        </button>
        
        <div className={styles.configStep}>
          <h2>Step 1: Select Challenge Level:</h2>
          <div className={styles.buttonGroup}>
            <button 
              className={`${styles.optionButton} ${challengeLevel === 'simple-words' ? styles.selected : ''}`}
              onClick={() => handleChallengeLevelChange('simple-words')}
            >
              Simple Words
            </button>
            <button 
              className={`${styles.optionButton} ${challengeLevel === 'compound-words' ? styles.selected : ''}`}
              onClick={() => handleChallengeLevelChange('compound-words')}
            >
              Compound Words
            </button>
            <button 
              className={`${styles.optionButton} ${challengeLevel === 'phrases' ? styles.selected : ''}`}
              onClick={() => handleChallengeLevelChange('phrases')}
            >
              Phrases
            </button>
            <button 
              className={`${styles.optionButton} ${challengeLevel === 'simple-sentences' ? styles.selected : ''}`}
              onClick={() => handleChallengeLevelChange('simple-sentences')}
            >
              Simple Sentences
            </button>
          </div>
        </div>
        
        <div className={styles.configStep}>
          <h2>Step 2: Select Learning Focus:</h2>
          <div className={styles.buttonGroup}>
            <button 
              className={`${styles.optionButton} ${learningFocus === 'short-vowels' ? styles.selected : ''}`}
              onClick={() => handleLearningFocusChange('short-vowels')}
            >
              Short Vowels
            </button>
            <button 
              className={`${styles.optionButton} ${learningFocus === 'long-vowels' ? styles.selected : ''}`}
              onClick={() => handleLearningFocusChange('long-vowels')}
            >
              Long Vowels
            </button>
            <button 
              className={`${styles.optionButton} ${learningFocus === 'blends' ? styles.selected : ''}`}
              onClick={() => handleLearningFocusChange('blends')}
            >
              Blends
            </button>
            <button 
              className={`${styles.optionButton} ${learningFocus === 'digraphs' ? styles.selected : ''}`}
              onClick={() => handleLearningFocusChange('digraphs')}
            >
              Digraphs
            </button>
          </div>
          
          <div className={styles.examplesBox}>
            <p>Examples Words: {exampleWords[learningFocus]} 
              <span className={styles.highlight}>(with highlighted {
                learningFocus === 'short-vowels' ? 'short vowels' :
                learningFocus === 'long-vowels' ? 'long vowels' :
                learningFocus === 'blends' ? 'blends' : 'digraphs'
              })</span>
            </p>
          </div>
        </div>
        
        <div className={styles.configStep}>
          <h2>Step 3: Difficulty:</h2>
          <div className={styles.buttonGroup}>
            <button 
              className={`${styles.difficultyButton} ${difficulty === 'easy' ? styles.selected : ''}`}
              onClick={() => handleDifficultyChange('easy')}
            >
              Easy
            </button>
            <button 
              className={`${styles.difficultyButton} ${difficulty === 'medium' ? styles.selected : ''}`}
              onClick={() => handleDifficultyChange('medium')}
            >
              Medium
            </button>
            <button 
              className={`${styles.difficultyButton} ${difficulty === 'hard' ? styles.selected : ''}`}
              onClick={() => handleDifficultyChange('hard')}
            >
              Hard
            </button>
            <button 
              className={`${styles.advancedButton} ${showAdvancedOptions ? styles.active : ''}`}
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            >
              Advanced options +
            </button>
          </div>
          
          {showAdvancedOptions && (
            <div className={styles.advancedOptions}>
              <div className={styles.optionRow}>
                <label>Fade Speed:</label>
                <select defaultValue="normal">
                  <option value="slow">Slow</option>
                  <option value="normal">Normal</option>
                  <option value="fast">Fast</option>
                </select>
              </div>
              <div className={styles.optionRow}>
                <label>Allow Hints:</label>
                <input type="checkbox" defaultChecked={true} />
              </div>
              <div className={styles.optionRow}>
                <label>Word Count:</label>
                <input type="number" defaultValue={10} min={5} max={20} />
              </div>
            </div>
          )}
        </div>
        
        <div className={styles.actionButtons}>
          <button 
            className={styles.backButton}
            onClick={handleBack}
          >
            Back
          </button>
          <button 
            className={styles.beginButton}
            onClick={handleBeginGame}
          >
            Begin Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default VanishingGameConfigScreen;