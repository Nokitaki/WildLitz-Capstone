import React from 'react';
import { motion } from 'framer-motion';
import '../../styles/syllable_clapping_game.css';

const SyllableLoadingScreen = ({ category, difficulty, onContinue }) => {
  return (
    <div className="syllable-game-container">
      <div className="loading-content">
        <div className="loading-card">
          <div className="game-header">
            <h1>WildLitz - Syllable Clapping Game</h1>
            <div className="progress-container">
              <div className="progress-bar" style={{ width: '40%' }}></div>
              <span className="progress-text">4/10</span>
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
            />
            <motion.div 
              className="dot"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
            />
            <motion.div 
              className="dot"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
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
          >
            Get ready for the next word!
          </motion.button>
          
          <div className="hint-box">
            <span role="img" aria-label="Hint">💡</span> Hint: A jungle animal
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyllableLoadingScreen;