import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/syllable_clapping_game.css';

const SyllableConfigScreen = ({ onStartGame }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isServerAvailable, setIsServerAvailable] = useState(true);
  
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
  
  const [showAnimations, setShowAnimations] = useState(true);
  const [playSounds, setPlaySounds] = useState(true);
  const [error, setError] = useState(null);
  
  // Check server availability when component mounts
  useEffect(() => {
    checkServerAvailability();
  }, []);
  
  // Function to check if the backend server is available
  const checkServerAvailability = () => {
    axios.get('/api/syllabification/get-word/')
      .then(() => {
        setIsServerAvailable(true);
        setError(null);
      })
      .catch(err => {
        console.error("Server check failed:", err);
        setIsServerAvailable(false);
        setError("Cannot connect to the backend server. Check if it's running and accessible.");
      });
  };
  
  // Handle category toggle
  const handleCategoryToggle = (category) => {
    setCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };
  
  // Handle save settings - a simplified version that just shows confirmation
  const handleSaveSettings = () => {
    alert("Settings saved!");
  };
  
  // Handle start game with improved error handling
  const handleBeginGame = () => {
    setIsLoading(true);
    setError(null);
    
    // Check if backend server is reachable first
    if (!isServerAvailable) {
      checkServerAvailability();
      if (!isServerAvailable) {
        setError("Backend server is not accessible. Please check your connection.");
        setIsLoading(false);
        return;
      }
    }
    
    // Prepare the data to send to the API
    const selectedCategories = Object.keys(categories)
    .filter(key => categories[key])
    .map(key => {
      // Convert camelCase to Title Case with spaces for API
      return key
        .replace(/([A-Z])/g, ' $1') // Insert a space before all capital letters
        .replace(/^./, function(str) { return str.toUpperCase(); }) // Capitalize the first character
        .trim(); // Remove potential leading space
    });
  
  if (selectedCategories.length === 0) {
    setError("Please select at least one word category");
    setIsLoading(false);
    return;
  }
  
  // Log the request for debugging
  console.log("Sending request to generate words:", {
    difficulty,
    count: 10,
    categories: selectedCategories
  });
    
    // Configuration to pass to the game
    const gameConfig = {
      difficulty,
      categories: selectedCategories, // Pass as array of strings
      showAnimations,
      playSounds
    };
    
    // Call the backend API to generate words with detailed error handling
    axios.post('/api/syllabification/generate-words/', {
      difficulty: difficulty,
      count: 10,
      categories: selectedCategories // Send categories as array
    })
    .then(response => {
      console.log("API response:", response.data);
      
      if (response.data && response.data.words && response.data.words.length > 0) {
        // Add the AI-generated words to the gameConfig
        gameConfig.words = response.data.words;
        onStartGame(gameConfig);
      } else {
        throw new Error("API returned empty or invalid words data");
      }
    })
    .catch(err => {
      console.error("Word generation error details:", err);
      
      if (err.response) {
        // The request was made and the server responded with an error status code
        const statusCode = err.response.status;
        let errorMsg = "";
        
        if (statusCode === 400) {
          errorMsg = "The request format was invalid. Check category names and difficulty level.";
        } else if (statusCode === 401 || statusCode === 403) {
          errorMsg = "Authentication error with the AI service. Please check API keys.";
        } else if (statusCode === 404) {
          errorMsg = "The API endpoint could not be found. Check backend routes.";
        } else if (statusCode === 500) {
          errorMsg = "Server error while generating words. The AI service might be experiencing issues.";
        } else {
          errorMsg = `Server error: ${statusCode}`;
        }
        
        if (err.response.data && err.response.data.error) {
          errorMsg += ` - ${err.response.data.error}`;
        }
        
        setError(errorMsg);
      } else if (err.request) {
        // The request was made but no response was received
        setError("No response received from the server. The API might be down or network issues.");
      } else {
        // Something happened in setting up the request
        setError(`Error: ${err.message}`);
      }
    })
    .finally(() => {
      setIsLoading(false);
    });
  };
  
  return (
    <div className="syllable-game-container">
      <div className="game-header">
        <h1>WildLitz - Syllable Clapping Game</h1>
      </div>
      
      <div className="config-content">
        <div className="config-card">
          {!isServerAvailable && (
            <div className="server-warning">
              <span role="img" aria-label="Warning">⚠️</span> 
              Backend server connection issue detected. Some features may not work.
              <button 
                className="retry-button"
                onClick={checkServerAvailability}
              >
                Retry Connection
              </button>
            </div>
          )}
          
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
          
          {error && (
            <div className="error-message">
              <span role="img" aria-label="Error">⚠️</span> {error}
              <div className="error-help">
                <em>Tip: Check if the backend server is running and that the OpenAI API key is valid.</em>
              </div>
            </div>
          )}
          
          <div className="ai-badge">
            <span role="img" aria-label="AI">🤖</span> AI-Powered Word Generation
          </div>
          
          <div className="config-actions">
            <button 
              className="config-button cancel"
              onClick={() => navigate('/home')}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              className="config-button save"
              onClick={handleSaveSettings}
              disabled={isLoading}
            >
              Save Settings
            </button>
            <button 
              className="config-button begin"
              onClick={handleBeginGame}
              disabled={isLoading || !isServerAvailable}
            >
              {isLoading ? 'Generating Words...' : 'Begin Game'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyllableConfigScreen;