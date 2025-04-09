import React, { useState } from 'react';
import { motion } from 'framer-motion';
import '../styles/syllable_clapping_game.css';

const SyllableConfigScreen = ({ onStartGame }) => {
  // Game configuration state
  const [difficulty, setDifficulty] = useState('easy');
  const [categories, setCategories] = useState({
    animals: true,
    colors: false,
    foodItems: true,
    actionWords: false,
    places: true,
    feelings: false,
    commonObjects: true,
    numbers: true,
    customWords: false
  });
  
  const [timePerWord, setTimePerWord] = useState(10);
  const [showAnimations, setShowAnimations] = useState(true);
  const [playSounds, setPlaySounds] = useState(true);
  
  // Handle category toggle
  const handleCategoryToggle = (category) => {
    setCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };
  
  // Handle start game
  const handleBeginGame = () => {
    const gameConfig = {
      difficulty,
      categories: Object.keys(categories).filter(key => categories[key]),
      timePerWord,
      showAnimations,
      playSounds
    };
    
    onStartGame(gameConfig);
  };
  
  return (
    <div className="syllable-game-container">
      <div className="game-header">
        <h1>WildLitz - Syllable Clapping Game</h1>
      </div>
      
      <div className="config-content">
        <div className="config-card">
          <div className="config-section">
            <h2>Select Difficulty Level:</h2>
            <div className="difficulty-options">
              <button 
                className={`config-button ${difficulty === 'easy' ? 'selected' : ''}`}
                onClick={() => setDifficulty('easy')}
              >
                Easy
              </button>
              <button 
                className={`config-button ${difficulty === 'medium' ? 'selected' : ''}`}
                onClick={() => setDifficulty('medium')}
              >
                Medium
              </button>
              <button 
                className={`config-button ${difficulty === 'hard' ? 'selected' : ''}`}
                onClick={() => setDifficulty('hard')}
              >
                Hard
              </button>
              <button 
                className={`config-button ${difficulty === 'custom' ? 'selected' : ''}`}
                onClick={() => setDifficulty('custom')}
              >
                Custom
              </button>
            </div>
          </div>
          
          <div className="config-section">
            <h2>Select Word Categories:</h2>
            <div className="categories-grid">
              <div className="category-option">
                <input 
                  type="checkbox" 
                  id="animals" 
                  checked={categories.animals}
                  onChange={() => handleCategoryToggle('animals')}
                />
                <label htmlFor="animals">Animals</label>
              </div>
              <div className="category-option">
                <input 
                  type="checkbox" 
                  id="colors" 
                  checked={categories.colors}
                  onChange={() => handleCategoryToggle('colors')}
                />
                <label htmlFor="colors">Colors</label>
              </div>
              <div className="category-option">
                <input 
                  type="checkbox" 
                  id="foodItems" 
                  checked={categories.foodItems}
                  onChange={() => handleCategoryToggle('foodItems')}
                />
                <label htmlFor="foodItems">Food Items</label>
              </div>
              <div className="category-option">
                <input 
                  type="checkbox" 
                  id="actionWords" 
                  checked={categories.actionWords}
                  onChange={() => handleCategoryToggle('actionWords')}
                />
                <label htmlFor="actionWords">Action Words</label>
              </div>
              <div className="category-option">
                <input 
                  type="checkbox" 
                  id="places" 
                  checked={categories.places}
                  onChange={() => handleCategoryToggle('places')}
                />
                <label htmlFor="places">Places</label>
              </div>
              <div className="category-option">
                <input 
                  type="checkbox" 
                  id="feelings" 
                  checked={categories.feelings}
                  onChange={() => handleCategoryToggle('feelings')}
                />
                <label htmlFor="feelings">Feelings</label>
              </div>
              <div className="category-option">
                <input 
                  type="checkbox" 
                  id="commonObjects" 
                  checked={categories.commonObjects}
                  onChange={() => handleCategoryToggle('commonObjects')}
                />
                <label htmlFor="commonObjects">Common Objects</label>
              </div>
              <div className="category-option">
                <input 
                  type="checkbox" 
                  id="numbers" 
                  checked={categories.numbers}
                  onChange={() => handleCategoryToggle('numbers')}
                />
                <label htmlFor="numbers">Numbers</label>
              </div>
              <div className="category-option">
                <input 
                  type="checkbox" 
                  id="customWords" 
                  checked={categories.customWords}
                  onChange={() => handleCategoryToggle('customWords')}
                />
                <label htmlFor="customWords">Custom Words</label>
              </div>
            </div>
          </div>
          
          <div className="config-section">
            <h2>Game Settings:</h2>
            <div className="settings-options">
              <div className="setting-option">
                <label htmlFor="timePerWord">Time per word:</label>
                <input 
                  type="range" 
                  id="timePerWord" 
                  min="5" 
                  max="20" 
                  step="1"
                  value={timePerWord}
                  onChange={(e) => setTimePerWord(parseInt(e.target.value))}
                />
                <span>{timePerWord} seconds</span>
              </div>
              
              <div className="setting-option">
                <input 
                  type="checkbox" 
                  id="showAnimations" 
                  checked={showAnimations}
                  onChange={() => setShowAnimations(!showAnimations)}
                />
                <label htmlFor="showAnimations">Show animations</label>
              </div>
              
              <div className="setting-option">
                <input 
                  type="checkbox" 
                  id="playSounds" 
                  checked={playSounds}
                  onChange={() => setPlaySounds(!playSounds)}
                />
                <label htmlFor="playSounds">Play sounds</label>
              </div>
            </div>
          </div>
          
          <div className="config-actions">
            <button 
              className="config-button cancel"
              onClick={() => window.history.back()}
            >
              Cancel
            </button>
            <button 
              className="config-button save"
            >
              Save Settings
            </button>
            <button 
              className="config-button begin"
              onClick={handleBeginGame}
            >
              Begin Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyllableConfigScreen;