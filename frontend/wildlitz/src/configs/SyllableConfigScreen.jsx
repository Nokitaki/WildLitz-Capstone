import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/syllable_clapping_game.css';
// Import a new modal component for custom words
import CustomWordModal from '../components/modals/CustomWordModal';
import { logAudioDebug } from '../utils/debugUtils'; // Import debug utilities if available

const SyllableConfigScreen = ({ onStartGame }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isServerAvailable, setIsServerAvailable] = useState(true);
  
  // Add state for custom words modal
  const [isCustomWordModalOpen, setIsCustomWordModalOpen] = useState(false);
  const [customWords, setCustomWords] = useState([]);
  
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
  });
  
  const [showAnimations, setShowAnimations] = useState(true);
  const [playSounds, setPlaySounds] = useState(true);
  const [error, setError] = useState(null);
  
  // Check server availability and load custom words when component mounts
  useEffect(() => {
    // Check server availability
    checkServerAvailability();
    
    // Load custom words from localStorage if available
    const savedWords = localStorage.getItem('wildlitz_custom_words');
    if (savedWords) {
      try {
        const parsedWords = JSON.parse(savedWords);
        setCustomWords(parsedWords);
        console.log(`Loaded ${parsedWords.length} custom words from localStorage`);
      } catch (error) {
        console.error("Error loading saved custom words:", error);
        // If there's an error parsing, clear the localStorage
        localStorage.removeItem('wildlitz_custom_words');
      }
    }
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
  
  // Handle opening the custom words modal
  const handleAddCustomWords = () => {
    setIsCustomWordModalOpen(true);
  };
  
  // Function to play a custom recording
  const handlePlayCustomRecording = (word) => {
    if (word.customAudio) {
      try {
        // Log for debugging
        console.log(`Playing custom recording for "${word.word}"`);
        
        const audio = new Audio(word.customAudio);
        
        // Add error handling
        audio.onerror = (e) => {
          console.error("Error playing custom audio:", e);
          alert(`Could not play the recording for "${word.word}". The audio format may not be supported.`);
        };
        
        // Play the audio
        audio.play()
          .then(() => console.log("Custom audio playing successfully"))
          .catch(error => {
            console.error("Failed to play custom audio:", error);
            alert(`Failed to play the recording for "${word.word}". Error: ${error.message}`);
          });
      } catch (error) {
        console.error("Error playing custom recording:", error);
        alert("Could not play the recording. The audio may be corrupted.");
      }
    } else {
      console.warn(`No custom audio found for word "${word.word}"`);
      alert(`This word doesn't have a custom recording.`);
    }
  };
  
  // Function to clear all custom words
  const handleClearCustomWords = () => {
    if (window.confirm("Are you sure you want to clear all custom words?")) {
      setCustomWords([]);
      // Also clear from localStorage
      localStorage.removeItem('wildlitz_custom_words');
      console.log("All custom words cleared");
    }
  };
  
  // Handle saving custom words from the modal
  const handleSaveCustomWords = (words) => {
    setCustomWords(words);
    setIsCustomWordModalOpen(false);
    
    // Save to localStorage
    try {
      localStorage.setItem('wildlitz_custom_words', JSON.stringify(words));
      console.log(`Saved ${words.length} custom words to localStorage`);
    } catch (error) {
      console.error("Error saving custom words to localStorage:", error);
      // Show a warning to the user
      alert("Warning: Your custom words couldn't be saved for future sessions. This could be due to browser storage restrictions or privacy settings.");
    }
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
    
    // Prepare the data to send to the API - convert the categories object to an array of selected categories
    const selectedCategories = Object.keys(categories)
      .filter(key => categories[key])
      .map(key => {
        // Convert camelCase to Title Case with spaces for API
        return key
          .replace(/([A-Z])/g, ' $1') // Insert a space before all capital letters
          .replace(/^./, function(str) { return str.toUpperCase(); }) // Capitalize the first character
          .trim(); // Remove potential leading space
      });
    
    if (selectedCategories.length === 0 && customWords.length === 0) {
      setError("Please select at least one word category or add custom words");
      setIsLoading(false);
      return;
    }
    
    // Log the request for debugging
    console.log("Sending request to generate words:", {
      difficulty,
      count: 10,
      categories: selectedCategories,
      customWords: customWords.length
    });
    
    // Configuration to pass to the game
    const gameConfig = {
      difficulty,
      categories: selectedCategories, // Pass as array of strings
      showAnimations,
      playSounds,
      customWords: customWords
    };
    
    // If custom words are provided, use those first
    if (customWords.length > 0) {
      // Log custom words for debugging (without full audio data)
      customWords.forEach((word, index) => {
        logAudioDebug ? 
          logAudioDebug(`Custom word ${index}`, word) :
          console.log(`Custom word ${index}: ${word.word}, Uses custom audio: ${word.usesCustomAudio}`);
      });
      
      // Format custom words for the game - converting them to the expected format
      const formattedCustomWords = customWords.map(word => {
        // Split the word into syllables (simplified - in a real app you'd use a proper syllabifier)
        const syllables = word.syllableBreakdown || word.word; // Use provided breakdown or simple word
        const count = word.syllableCount || (syllables.split('-').length);
        
        return {
          word: word.word,
          syllables: syllables,
          count: count,
          category: word.category || "Custom",
          isCustomWord: true,
          usesCustomAudio: word.usesCustomAudio,
          customAudio: word.customAudio
        };
      });
      
      // If we have enough custom words, just use those
      if (formattedCustomWords.length >= 5) {
        gameConfig.words = formattedCustomWords;
        onStartGame(gameConfig);
        setIsLoading(false);
        return;
      }
      
      // Otherwise include some from the API too
      gameConfig.customWords = formattedCustomWords;
    }
    
    // Call the backend API to generate words with detailed error handling
    axios.post('/api/syllabification/generate-words/', {
      difficulty: difficulty,
      count: 10 - customWords.length, // Fewer words needed if we have custom ones
      categories: selectedCategories // Send categories as array
    })
    .then(response => {
      console.log("API response:", response.data);
      
      if (response.data && response.data.words && response.data.words.length > 0) {
        // Combine custom words with API-generated words
        if (customWords.length > 0) {
          const formattedCustomWords = customWords.map(word => ({
            word: word.word,
            syllables: word.syllableBreakdown || word.word,
            count: word.syllableCount || (word.syllableBreakdown ? word.syllableBreakdown.split('-').length : 1),
            category: word.category || "Custom",
            isCustomWord: true,
            usesCustomAudio: word.usesCustomAudio,
            customAudio: word.customAudio
          }));
          
          // Add the AI-generated words to the gameConfig, combined with custom words
          gameConfig.words = [...formattedCustomWords, ...response.data.words];
        } else {
          // Just use the AI-generated words
          gameConfig.words = response.data.words;
        }
        
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
          
          {/* Show custom words if any are added - Enhanced display */}
          {customWords.length > 0 && (
            <div className="custom-words-summary">
              <h3>Custom Words Added: {customWords.length}</h3>
              <div className="custom-words-list">
                {customWords.map((word, index) => (
                  <div key={index} className="custom-word-card">
                    <div className="custom-word-info">
                      <span className="custom-word-text">{word.word}</span>
                      <div className="custom-word-details">
                        <span className="custom-word-category">{word.category}</span>
                        {word.syllableBreakdown && (
                          <span className="custom-word-syllables">{word.syllableBreakdown}</span>
                        )}
                        {word.usesCustomAudio && (
                          <button 
                            className="play-recording-button"
                            onClick={() => handlePlayCustomRecording(word)}
                          >
                            <span role="img" aria-label="Play Recording">🔊</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="custom-words-actions">
                <button 
                  className="clear-words-button"
                  onClick={handleClearCustomWords}
                >
                  Clear All Words
                </button>
                <button 
                  className="edit-words-button"
                  onClick={() => setIsCustomWordModalOpen(true)}
                >
                  Edit Words
                </button>
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
              className="config-button custom-words"
              onClick={handleAddCustomWords}
              disabled={isLoading}
            >
              Add Custom Words
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
      
      {/* Custom Word Modal */}
      <CustomWordModal
        isOpen={isCustomWordModalOpen}
        onClose={() => setIsCustomWordModalOpen(false)}
        onSave={handleSaveCustomWords}
        existingWords={customWords}
      />
    </div>
  );
};

export default SyllableConfigScreen;