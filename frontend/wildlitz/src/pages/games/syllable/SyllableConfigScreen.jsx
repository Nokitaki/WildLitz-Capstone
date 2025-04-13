import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../../styles/components/SyllableClappingGame.css';
import CustomWordModal from '../../../components/modals/CustomWordModal';
import '../../../styles/components/SyllableConfigScreen.css';

const SyllableConfigScreen = ({ onStartGame }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isServerAvailable, setIsServerAvailable] = useState(true);
  
  // Add state for custom words modal
  const [isCustomWordModalOpen, setIsCustomWordModalOpen] = useState(false);
  const [customWords, setCustomWords] = useState([]);
  const [selectedCustomWords, setSelectedCustomWords] = useState({});
  
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
  
  // Question count state (replaces game settings)
  const [questionCount, setQuestionCount] = useState(10);
  
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
        
        // Initialize selected state for all words (default to not selected)
        const initialSelection = {};
        parsedWords.forEach(word => {
          initialSelection[word.word] = false;
        });
        setSelectedCustomWords(initialSelection);
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
  
  // Handle custom word selection/deselection
  const handleCustomWordSelection = (word) => {
    setSelectedCustomWords(prev => ({
      ...prev,
      [word]: !prev[word]
    }));
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
      setSelectedCustomWords({});
      // Also clear from localStorage
      localStorage.removeItem('wildlitz_custom_words');
      console.log("All custom words cleared");
    }
  };
  
  // Handle saving custom words from the modal
  const handleSaveCustomWords = (words) => {
    setCustomWords(words);
    
    // Initialize selected state for all words (default to not selected)
    const initialSelection = {};
    words.forEach(word => {
      // Keep existing selections if any
      initialSelection[word.word] = selectedCustomWords[word.word] || false;
    });
    setSelectedCustomWords(initialSelection);
    
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
    
    // Convert the categories object to an array of selected categories
    const selectedCategories = Object.keys(categories)
      .filter(key => categories[key])
      .map(key => {
        // Convert camelCase to Title Case with spaces for API
        return key
          .replace(/([A-Z])/g, ' $1') // Insert a space before all capital letters
          .replace(/^./, function(str) { return str.toUpperCase(); }) // Capitalize the first character
          .trim(); // Remove potential leading space
      });
    
    // Filter the custom words to only include selected ones
    const selectedWords = customWords.filter(word => 
      selectedCustomWords[word.word]
    );
    
    // Make sure we don't have any duplicates in the selected words
    const uniqueSelectedWords = [];
    const wordSet = new Set();
    
    selectedWords.forEach(word => {
      if (!wordSet.has(word.word)) {
        wordSet.add(word.word);
        uniqueSelectedWords.push(word);
      }
    });
    
    // If no categories or custom words are selected
    if (selectedCategories.length === 0 && uniqueSelectedWords.length === 0) {
      setError("Please select at least one word category or select some custom words");
      setIsLoading(false);
      return;
    }
    
    // Determine how many AI words we need
    const aiWordCount = Math.max(0, questionCount - uniqueSelectedWords.length);
    
    // Configuration to pass to the game
    const gameConfig = {
      difficulty,
      categories: selectedCategories,
      questionCount: questionCount,
      customWords: uniqueSelectedWords
    };
    
    // If we have enough custom words for all questions
    if (uniqueSelectedWords.length >= questionCount) {
      // Just use the first questionCount custom words
      gameConfig.words = uniqueSelectedWords.slice(0, questionCount);
      onStartGame(gameConfig);
      setIsLoading(false);
      return;
    }
    
    // Otherwise include all custom words
    gameConfig.customWords = uniqueSelectedWords;
    
    // Call the backend API for additional words if needed
    if (aiWordCount > 0) {
      // Create an array of words to exclude - to avoid duplicating any custom words
      const wordsToExclude = uniqueSelectedWords.map(word => word.word);
      
      axios.post('/api/syllabification/generate-words/', {
        difficulty: difficulty,
        count: aiWordCount,
        categories: selectedCategories,
        // Send list of words to exclude
        previous_words: wordsToExclude
      })
      .then(response => {
        if (response.data && response.data.words && response.data.words.length > 0) {
          // Filter out any AI words that might duplicate custom words
          const aiWords = response.data.words.filter(
            word => !wordsToExclude.includes(word.word)
          );
          
          // Combine custom words with AI-generated words
          if (gameConfig.customWords && gameConfig.customWords.length > 0) {
            gameConfig.words = [...gameConfig.customWords, ...aiWords];
          } else {
            gameConfig.words = aiWords;
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
    } else if (gameConfig.customWords && gameConfig.customWords.length > 0) {
      // If we don't need AI words but have custom words
      gameConfig.words = gameConfig.customWords;
      onStartGame(gameConfig);
      setIsLoading(false);
    }
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
          
          {/* Number of Questions section (replaces Game Settings) */}
          <div className="config-section">
            <h2>Number of Questions:</h2>
            <div className="question-count-slider">
              <input
                type="range"
                min="5"
                max="20"
                step="1"
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value, 10))}
              />
              <span className="question-count-display">{questionCount}</span>
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
          
          {/* Show custom words if any are added */}
          {customWords.length > 0 && (
            <div className="custom-words-summary">
              <h3>Custom Words Available: {customWords.length}</h3>
              <div className="custom-words-list">
                {customWords.map((word, index) => (
                  <div key={index} className="custom-word-card">
                    <div className="custom-word-checkbox">
                      <input
                        type="checkbox"
                        id={`word-${index}`}
                        checked={selectedCustomWords[word.word] || false}
                        onChange={() => handleCustomWordSelection(word.word)}
                      />
                      <label htmlFor={`word-${index}`}></label>
                    </div>
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