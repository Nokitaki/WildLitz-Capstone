import React from 'react';
import { motion } from 'framer-motion';
import '../../styles/syllable_clapping_game.css';

const SyllableLoadingScreen = ({ category, difficulty, onContinue, wordIndex = 0, totalWords = 10 }) => {
  // Get appropriate hint based on category
  const getHint = (category) => {
    const hints = {
      'Animals': 'A creature from the animal kingdom',
      'Colors': 'Something that describes visual appearance',
      'Food Items': 'Something you can eat',
      'Action Words': 'Something you can do',
      'Places': 'Somewhere you can go',
      'Feelings': 'An emotion or sensation',
      'Common Objects': 'Something you might use every day',
      'Numbers': 'Related to counting or mathematics',
      'Custom Words': 'A special word selected for learning'
    };
    
    return hints[category] || 'Focus on listening for syllables';
  };

  // Get color theme based on difficulty
  const getDifficultyColor = (level) => {
    switch(level.toLowerCase()) {
      case 'easy': return '#4caf50'; // Green
      case 'medium': return '#ff9800'; // Orange
      case 'hard': return '#f44336'; // Red
      case 'custom': return '#9c27b0'; // Purple
      default: return '#2196f3'; // Blue
    }
  };

  return (
    <div className="syllable-game-container">
      <div className="loading-content">
        <div className="loading-card">
          <div className="game-header">
            <h1>WildLitz - Syllable Clapping Game</h1>
            <div className="progress-container">
              <div 
                className="progress-bar" 
                style={{ 
                  width: `${(wordIndex / totalWords * 100)}%`,
                  backgroundColor: getDifficultyColor(difficulty)
                }}
              ></div>
              <span className="progress-text">{wordIndex}/{totalWords}</span>
            </div>
          </div>
          
          <div className="ai-badge">
            <span role="img" aria-label="AI">🤖</span> AI Assisted Selection
          </div>
          
          <h2 className="loading-title">Preparing Next Word...</h2>
          
          <div className="loading-dots">
            <motion.div 
              className="dot"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0 }}
              style={{ backgroundColor: getDifficultyColor(difficulty) }}
            />
            <motion.div 
              className="dot"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
              style={{ backgroundColor: getDifficultyColor(difficulty) }}
            />
            <motion.div 
              className="dot"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
              style={{ backgroundColor: getDifficultyColor(difficulty) }}
            />
          </div>
          
          <div className="info-box category">
            <p>Category: {category}</p>
          </div>
          
          <div className="info-box difficulty">
            <p>Difficulty Level: {difficulty}</p>
          </div>
          
          <motion.button 
            className="ready-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onContinue}
            style={{ backgroundColor: getDifficultyColor(difficulty) }}
          >
            Get ready for the next word!
          </motion.button>
          
          <div className="hint-box">
            <span role="img" aria-label="Hint">💡</span> Hint: {getHint(category)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyllableLoadingScreen;