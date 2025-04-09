import React, { useState } from 'react';
import { motion } from 'framer-motion';
import '../../styles/syllable_clapping_game.css';

const SyllableDemoScreen = ({ word, syllables, onBack }) => {
  const [selectedSyllable, setSelectedSyllable] = useState('all');
  const [playbackSpeed, setPlaybackSpeed] = useState('normal');
  
  // Mock function to simulate playing sound
  const playSound = (syllable) => {
    console.log(`Playing sound for syllable: ${syllable}`);
  };
  
  // Function to get phonetic description based on syllable
  const getPhoneticDescription = (syllable) => {
    const descriptions = {
      'el': 'Open-mid front vowel\nLike in "egg" and "red"',
      'e': 'Mid front vowel\nLike in "day" and "may"',
      'phant': 'Consonant blend "ph" + "ant"\nLike in "phantom"'
    };
    
    return descriptions[syllable] || 'Pronounce the syllable clearly';
  };
  
  return (
    <div className="syllable-game-container">
      <div className="demo-content">
        <div className="demo-card">
          <div className="game-header">
            <h1>WildLitz - Syllable Sound Demonstration</h1>
            <div className="word-badge">
              Word: {word}
            </div>
          </div>
          
          <h2 className="demo-title">Listen and Watch Each Syllable</h2>
          
          <div className="syllable-buttons">
            {syllables.map((syllable, index) => (
              <button 
                key={index}
                className={`syllable-button ${selectedSyllable === syllable ? 'active' : ''}`}
                onClick={() => setSelectedSyllable(syllable)}
              >
                {syllable}
              </button>
            ))}
            <button 
              className={`syllable-button ${selectedSyllable === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedSyllable('all')}
            >
              All
            </button>
          </div>
          
          <div className="demo-display">
            <motion.button 
              className="clap-play-button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => playSound(selectedSyllable)}
            >
              <span role="img" aria-label="Play">▶️</span>
            </motion.button>
            
            <div className="phonetic-display">
              <div className="sound-label">
                Sound: /e/
              </div>
              
              <div className="mouth-diagram">
                <svg width="150" height="100" viewBox="0 0 150 100">
                  <ellipse cx="75" cy="50" rx="70" ry="40" stroke="#333" strokeWidth="2" fill="none" />
                  <path d="M30,50 Q75,80 120,50" stroke="#f00" strokeWidth="2" fill="none" />
                </svg>
                <p className="diagram-label">{getPhoneticDescription(selectedSyllable)}</p>
              </div>
              
              <button 
                className={`speed-button ${playbackSpeed === 'slow' ? 'active' : ''}`}
                onClick={() => setPlaybackSpeed('slow')}
              >
                Slow
              </button>
            </div>
          </div>
          
          <div className="practice-section">
            <h3>Practice with this sound:</h3>
            <p>
              Try saying the syllable slowly, then at normal speed. Pay attention to the shape of your mouth and the position of your tongue.
            </p>
          </div>
          
          <div className="demo-controls">
            <button 
              className="control-button back"
              onClick={onBack}
            >
              Back to Game
            </button>
            <button 
              className="control-button next"
            >
              Next Syllable
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyllableDemoScreen;