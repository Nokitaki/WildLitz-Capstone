import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../../styles/syllable_clapping_game.css';
import SyllableConfigScreen from '../../../configs/SyllableConfigScreen';
import SyllableLoadingScreen from '../../../components/loading/SyllableLoadingScreen';
import SyllableDemoScreen from './SyllableDemoScreen';
import wildLitzCharacter from '../../../assets/img/wildlitz-idle.png';
import AudioLoadingIndicator from '../../../components/audio/AudioLoadingIndicator';
import syllableClappingCharacter from '../../../assets/img/syllable-clapping-character.svg';

function SyllableClappingGame() {
  const navigate = useNavigate();
  
  // Game state management
  const [gameState, setGameState] = useState('config'); // config, loading, playing, feedback, demo
  const [gameConfig, setGameConfig] = useState(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentWord, setCurrentWord] = useState(null);
  const [gameWords, setGameWords] = useState([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  const audioRef = useRef(null);
  
  // Log when the component mounts for debugging
  useEffect(() => {
    console.log("SyllableClappingGame component mounted");
    
    // Cleanup function for when component unmounts
    return () => {
      // Cancel any speech synthesis
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      
      // Stop any audio playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);
  
  // Handle starting the game after configuration
  // In SyllableConfigScreen.jsx, modify the handleStartGame function:

  const handleStartGame = (config) => {
    // Track already processed words to avoid duplicates
    const processedWordIds = new Set();
    let processedWords = [];
    
    // If config has custom words that were selected
    if (config.customWords && config.customWords.length > 0) {
      // Process each custom word only once
      config.customWords.forEach(word => {
        // Use word text as unique identifier
        if (!processedWordIds.has(word.word)) {
          processedWordIds.add(word.word);
          
          processedWords.push({
            ...word,
            isCustomWord: true, // Mark as custom word
            // Make sure audio flags are properly set
            usesCustomAudio: word.usesCustomAudio === true || (word.customAudio ? true : false)
          });
        }
      });
      console.log(`Processed ${processedWords.length} custom words`);
    }
    
    // If config has AI-generated words, add those too
    if (config.words && config.words.length > 0) {
      // Only add AI words that haven't been processed yet
      const newAiWords = config.words.filter(word => !processedWordIds.has(word.word));
      
      // Combine with existing words
      processedWords = [...processedWords, ...newAiWords];
      console.log(`Total words: ${processedWords.length}`);
    }
    
    // Update game state
    setGameWords(processedWords);
    setCurrentWordIndex(0);
    setGameState('loading');
    
    // Log the first few words for debugging
    processedWords.slice(0, 3).forEach((word, idx) => {
      console.log(`Word ${idx}: ${word.word}, isCustom: ${!!word.isCustomWord}, hasCustomAudio: ${!!word.usesCustomAudio}`);
    });
    
    // Simulate loading AI-generated word
    setTimeout(() => {
      if (processedWords.length > 0) {
        setCurrentWord(processedWords[0]);
        setUserAnswer('');
        setShowFeedback(false);
        setGameState('playing');
      } else {
        setError("No words available. Please try again.");
        setGameState('config');
      }
    }, 2000);
  };

  // Handle the continue button in playing state
  const handleContinue = () => {
    setShowFeedback(true);
    setGameState('feedback');
  };
  
  // Play word pronunciation with improved error handling
  const handlePlayWordSound = () => {
    if (!currentWord) return;
    
    // Prevent multiple audio playbacks
    if (isPlayingAudio) {
      console.log("Already playing audio, ignoring request");
      return;
    }
    
    setIsPlayingAudio(true);
    console.log(`Attempting to play word: "${currentWord.word}", custom audio: ${currentWord.usesCustomAudio}`);
    
    // Create a new audio element for better control
    const audio = new Audio();
    audioRef.current = audio;
    
    // Set up audio event handlers
    audio.onended = () => {
      console.log("Audio playback ended");
      setIsPlayingAudio(false);
    };
    
    audio.onerror = (e) => {
      console.error("Audio playback error:", e);
      setIsPlayingAudio(false);
      tryApiAudio();
    };
    
    // Check if we have a custom audio recording for this word
    if (currentWord.usesCustomAudio && currentWord.customAudio) {
      try {
        console.log("Using custom audio recording");
        audio.src = currentWord.customAudio;
        
        audio.play()
          .then(() => console.log("Custom audio playing successfully"))
          .catch(error => {
            console.error("Failed to play custom audio:", error);
            tryApiAudio();
          });
        
        return;
      } catch (error) {
        console.error("Error setting up custom audio:", error);
        tryApiAudio();
      }
    } else {
      console.log("No custom audio, trying API");
      tryApiAudio();
    }
    
    // Function to use the TTS API
    function tryApiAudio() {
      console.log("Trying API audio");
      
      axios.post('/api/syllabification/text-to-speech/', {
        text: currentWord.word,
        voice: 'nova'
      })
      .then(response => {
        if (response.data && response.data.success && response.data.audio_data) {
          console.log("API audio received, playing");
          
          // Create a new audio element each time
          const newAudio = new Audio(`data:audio/mp3;base64,${response.data.audio_data}`);
          audioRef.current = newAudio;
          
          newAudio.onended = () => {
            console.log("API audio playback ended");
            setIsPlayingAudio(false);
          };
          
          newAudio.onerror = (e) => {
            console.error("API audio playback error:", e);
            setIsPlayingAudio(false);
            tryBrowserSpeech();
          };
          
          newAudio.play()
            .then(() => console.log("API audio playing successfully"))
            .catch(error => {
              console.error("Failed to play API audio:", error);
              tryBrowserSpeech();
            });
        } else {
          console.log("Invalid API response, falling back to browser speech");
          tryBrowserSpeech();
        }
      })
      .catch(err => {
        console.error("Error calling TTS API:", err);
        tryBrowserSpeech();
      });
    }
    
    // Function to use browser's speech synthesis
    function tryBrowserSpeech() {
      console.log("Using browser speech synthesis");
      
      if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(currentWord.word);
        utterance.rate = 0.8;
        
        utterance.onend = () => {
          console.log("Browser speech ended");
          setIsPlayingAudio(false);
        };
        
        utterance.onerror = (e) => {
          console.error("Browser speech error:", e);
          setIsPlayingAudio(false);
        };
        
        window.speechSynthesis.speak(utterance);
      } else {
        console.error("Speech synthesis not available in this browser");
        setIsPlayingAudio(false);
      }
    }
  };
  
  // Handle the next word button in feedback state
  const handleNextWord = () => {
  const nextIndex = currentWordIndex + 1;
  
  // Check if we've completed all words
  if (nextIndex >= gameWords.length) {
    // Game complete
    alert("Congratulations! You've completed all the words!");
    setGameState('config');
    return;
  }
  
  // Reset audio state before moving to loading screen
  setIsPlayingAudio(false);
  
  // Clear any existing audio element
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current.src = '';
    audioRef.current = null;
  }
  
  // Go to loading screen
  setGameState('loading');
  setCurrentWordIndex(nextIndex);
  
  // Move to the next word
  setTimeout(() => {
    setCurrentWord(gameWords[nextIndex]);
    setUserAnswer('');
    setShowFeedback(false);
    setGameState('playing');
  }, 2000);
};
  
  // Handle checking syllable claps
  const handleCheckClaps = () => {
    if (!currentWord || !userAnswer) return;
    
    setIsLoading(true);
    
    // Get the correct syllable count and breakdown
    // IMPORTANT: Don't override this with a default value of 1!
    let correctCount;
    let syllableBreakdown;
    
    // For custom words, use the syllable data provided by the user
    if (currentWord.isCustomWord) {
      // Use the syllable count from the custom word data
      correctCount = currentWord.syllableCount || 
                    (currentWord.syllableBreakdown ? currentWord.syllableBreakdown.split('-').length : null);
      syllableBreakdown = currentWord.syllableBreakdown || currentWord.word;
    } else {
      // For AI-generated words, use the count from the API
      correctCount = currentWord.count || 
                    (currentWord.syllables ? 
                      (currentWord.syllables.match(/-/g) || []).length + 1 : 
                      null);
      syllableBreakdown = currentWord.syllables || currentWord.word;
    }
    
    // CRITICAL: Don't default to 1 if we couldn't determine the syllable count
    // Instead, call the API to get the correct count
    if (correctCount === null) {
      // Call API to get syllable count for this word
      axios.post('/api/syllabification/analyze-word/', {
        word: currentWord.word
      })
      .then(response => {
        if (response.data && response.data.syllable_count) {
          processClaps(response.data.syllable_count, response.data.syllable_breakdown || syllableBreakdown);
        } else {
          // If API didn't return valid data, use basic counting as fallback
          const basicCount = countSyllables(currentWord.word);
          processClaps(basicCount, syllableBreakdown);
        }
      })
      .catch(err => {
        console.error("Error getting syllable count from API:", err);
        // Fallback to basic counting
        const basicCount = countSyllables(currentWord.word);
        processClaps(basicCount, syllableBreakdown);
      });
    } else {
      // We already have a valid syllable count, proceed with checking
      processClaps(correctCount, syllableBreakdown);
    }
    
    // Function to process claps once we have the syllable count
    function processClaps(correctSyllableCount, breakdown) {
      // Check if the user's answer is correct
      const userCount = parseInt(userAnswer, 10);
      const isCorrect = userCount === correctSyllableCount;
      
      // Create feedback data
      const localFeedback = {
        is_correct: isCorrect,
        correct_count: correctSyllableCount,
        user_count: userCount,
        word: currentWord.word,
        syllable_breakdown: breakdown,
        feedback: isCorrect ? 
          `Great job! "${currentWord.word}" has ${correctSyllableCount} syllable${correctSyllableCount !== 1 ? 's' : ''}: ${breakdown}.` :
          `Nice try! "${currentWord.word}" actually has ${correctSyllableCount} syllable${correctSyllableCount !== 1 ? 's' : ''}: ${breakdown}. Try saying the word slowly, focusing on each vowel sound.`
      };
      
      // Update with local feedback immediately
      setCurrentWord({
        ...currentWord,
        feedback: localFeedback,
        isCorrect: isCorrect
      });
      
      // Show feedback
      handleContinue();
      setIsLoading(false);
    }
    
    // Basic syllable counting function as fallback
    function countSyllables(word) {
      const vowels = ['a', 'e', 'i', 'o', 'u', 'y'];
      let count = 0;
      let inVowelGroup = false;
      
      for (let i = 0; i < word.length; i++) {
        const isVowel = vowels.includes(word[i].toLowerCase());
        
        if (isVowel && !inVowelGroup) {
          count++;
          inVowelGroup = true;
        } else if (!isVowel) {
          inVowelGroup = false;
        }
      }
      
      // Ensure we have at least one syllable
      return Math.max(1, count);
    }
  };
  
  // Get hint for incorrect answers
  const getHintForIncorrectAnswer = (word, syllableBreakdown) => {
    return "Try saying the word slowly, focusing on each vowel sound.";
  };
  
  // Handle changing the answer value
  const handleAnswerChange = (e) => {
    // Only allow numeric input
    const value = e.target.value.replace(/[^0-9]/g, '');
    setUserAnswer(value);
  };
  
  // Handle showing the demonstration
  const handleShowDemo = () => {
    if (!currentWord) return;
    
    // Get syllable sounds explanation from backend
    axios.get(`/api/syllabification/syllable-sounds/?word=${currentWord.word}`)
    .then(response => {
      if (response.data) {
        // Update current word with syllable explanation
        setCurrentWord({
          ...currentWord,
          syllableExplanation: response.data
        });
      }
      setGameState('demo');
    })
    .catch(err => {
      console.error("Error getting syllable sounds:", err);
      // Go to demo anyway, but with limited data
      setGameState('demo');
    });
  };
  
  // Handle returning from demonstration to feedback
  const handleBackFromDemo = () => {
    setGameState('feedback');
  };
  
  // Handle continuing from loading to playing
  const handleContinueFromLoading = () => {
    setGameState('playing');
  };

  // Break word into syllables (using the syllable breakdown from backend)
  const breakIntoSyllables = (word, syllableBreakdown) => {
    if (!word) return [];
    if (!syllableBreakdown) return [word];
    
    // If the syllable breakdown contains hyphens, split by those
    if (syllableBreakdown.includes('-')) {
      return syllableBreakdown.split('-');
    } 
    
    // If no hyphens but we have the word, return the whole word
    return [word];
  };
  
  // Get syllable count from word data
  const getSyllableCount = (word) => {
    if (!word) return 0;
    
    // First check if the feedback contains the correct count
    if (word.feedback && word.feedback.correct_count) {
      return word.feedback.correct_count;
    }
    
    // For custom words, use the syllable count provided by the user
    if (word.isCustomWord && word.syllableCount) {
      return word.syllableCount;
    }
    
    // For other cases, check if count is directly available
    if (word.count) {
      return word.count;
    }
    
    // If we have syllable breakdown, count the hyphens and add 1
    if (word.syllableBreakdown && word.syllableBreakdown.includes('-')) {
      return (word.syllableBreakdown.match(/-/g) || []).length + 1;
    }
    
    if (word.syllables && word.syllables.includes('-')) {
      return (word.syllables.match(/-/g) || []).length + 1;
    }
    
    // If no information is available, default to 1
    return 1;
  };

  // Helper function to get word category
  const getWordCategory = (word) => {
    if (!word) return 'Words';
    if (word.category) return word.category;
    
    // If no category is available, try to determine it from game config
    if (gameConfig && gameConfig.categories && gameConfig.categories.length > 0) {
      return gameConfig.categories[0].charAt(0).toUpperCase() + gameConfig.categories[0].slice(1);
    }
    
    return 'Words';
  };

  // Handle generating more words if we run out
  const handleGenerateMoreWords = () => {
    // Only needed if we run out of words from the initial set
    if (!gameConfig || !gameConfig.categories || gameConfig.categories.length === 0) {
      console.error("Missing game configuration for generating more words");
      return;
    }
    
    setIsLoading(true);
    
    // Call API to generate more words in the same categories
    axios.post('/api/syllabification/generate-words/', {
      difficulty: gameConfig.difficulty,
      count: 10,
      categories: gameConfig.categories,
      previous_words: gameWords.map(word => word.word) // Exclude words we've already used
    })
    .then(response => {
      if (response.data && response.data.words && response.data.words.length > 0) {
        // Add new words to the game words
        const newWords = response.data.words;
        setGameWords(prevWords => [...prevWords, ...newWords]);
        
        // Update the current word to the first new word
        setCurrentWord(newWords[0]);
        setCurrentWordIndex(gameWords.length); // Set index to the first new word
        setUserAnswer('');
        setShowFeedback(false);
        setGameState('playing');
      } else {
        throw new Error("API returned empty or invalid words data");
      }
    })
    .catch(err => {
      console.error("Error generating more words:", err);
      setError("Failed to generate more words. Please try again.");
    })
    .finally(() => {
      setIsLoading(false);
    });
  };
  
  // Render the appropriate screen based on game state
  const renderGameContent = () => {
    switch (gameState) {
      case 'config':
        return <SyllableConfigScreen onStartGame={handleStartGame} />;
        
      case 'loading':
        return (
          <SyllableLoadingScreen 
            category={getWordCategory(currentWord)} 
            difficulty={gameConfig?.difficulty || 'easy'} 
            onContinue={handleContinueFromLoading}
            wordIndex={currentWordIndex}
            totalWords={gameWords.length}
          />
        );
        
      case 'playing':
        return (
          <div className="syllable-game-container">
            <div className="game-content-wrapper">
              <img 
                src={syllableClappingCharacter} 
                alt="syllable-clapping-character" 
                className="wildlitz-character"
              />
              
              <div className="game-play-card">
                <div className="game-header">
                  <h1>WildLitz - Syllable Clapping Game</h1>
                  <div className="progress-container">
                    <div 
                      className="progress-bar" 
                      style={{ width: `${((currentWordIndex) / gameWords.length * 100)}%` }}
                    ></div>
                    <span className="progress-text">{currentWordIndex}/{gameWords.length}</span>
                  </div>
                </div>
              
                <div className="level-indicator">
                  <span>{getSyllableCount(currentWord)}</span>
                </div>
                
                <h2>Listen to the word and count the syllables!</h2>
                
                <div className="word-display">
                  <div className="category-label">{getWordCategory(currentWord)}</div>
                  <div className="word-text">{currentWord?.word || ''}</div>
                  <button 
                    className={`sound-button ${isPlayingAudio ? 'playing' : ''}`} 
                    onClick={handlePlayWordSound}
                    disabled={isPlayingAudio}
                  >
                    <span role="img" aria-label="Play sound">🔊</span>
                  </button>
                  
                  {/* Audio playing indicator */}
                  <AudioLoadingIndicator isPlaying={isPlayingAudio} />
                  
                  {/* Audio element for better control */}
                  <audio ref={audioRef} style={{ display: 'none' }} />
                </div>
                
                <div className="clap-instruction">Clap for each syllable!</div>
                
                <div className="answer-input-container">
                  <label htmlFor="syllable-count">Number of syllables heard:</label>
                  <input 
                    type="number" 
                    id="syllable-count" 
                    className="syllable-input"
                    value={userAnswer}
                    onChange={handleAnswerChange}
                    min="1"
                    max="10"
                    placeholder="Enter number"
                  />
                </div>
                
                {error && <div className="error-message">{error}</div>}
                
                <div className="action-buttons">
                  <button className="hint-button" disabled={isLoading}>Hint</button>
                  <button 
                    className="replay-button" 
                    onClick={handlePlayWordSound}
                    disabled={isLoading || isPlayingAudio}
                  >
                    {isPlayingAudio ? 'Playing...' : 'Replay'}
                  </button>
                  <button 
                    className="continue-button" 
                    onClick={handleCheckClaps}
                    disabled={!userAnswer || isLoading}
                  >
                    {isLoading ? 'Checking...' : 'Continue'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'feedback':
        return (
          <div className="syllable-game-container">
            <div className="game-content-wrapper">
              <img 
                src={wildLitzCharacter} 
                alt="WildLitz Character" 
                className="wildlitz-character"
              />
              
              <div className="game-feedback-card">
                <div className="game-header">
                  <h1>WildLitz - Syllable Clapping Game</h1>
                  <div className="progress-container">
                    <div 
                      className="progress-bar" 
                      style={{ width: `${((currentWordIndex) / gameWords.length * 100)}%` }}
                    ></div>
                    <span className="progress-text">{currentWordIndex}/{gameWords.length}</span>
                  </div>
                </div>
                
                <div className={`feedback-message ${currentWord?.isCorrect ? 'correct' : 'incorrect'}`}>
                  {currentWord?.feedback?.feedback || 
                    (currentWord?.isCorrect ? 
                      `Great job! This word has ${getSyllableCount(currentWord)} syllables.` :
                      `Nice try! This word has ${getSyllableCount(currentWord)} syllables.`
                    )
                  }
                  {userAnswer && <div>Your answer: {userAnswer}</div>}
                </div>
                
                <div className="syllable-breakdown">
                  {breakIntoSyllables(
                    currentWord?.word || '', 
                    currentWord?.feedback?.syllable_breakdown || currentWord?.syllables
                  ).map((syllable, index) => (
                    <motion.div 
                      key={index}
                      className="syllable-part"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.2 }}
                    >
                      {syllable}
                      <motion.div 
                        className="sound-indicator"
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.2, 1] }}
                        transition={{ delay: index * 0.2 + 0.1, duration: 0.5 }}
                      >
                        🔊
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
                
                <div className="syllable-rule">
                  <h3>Syllable Rule:</h3>
                  <p>Each syllable typically contains at least one vowel sound.</p>
                  <p>
                    In "{currentWord?.word || ''}", we hear the sounds: {
                      breakIntoSyllables(
                        currentWord?.word || '', 
                        currentWord?.feedback?.syllable_breakdown || currentWord?.syllables
                      ).join(' - ')
                    }
                  </p>
                </div>
                
                <div className="action-buttons">
                  <button 
                    className="hint-button" 
                    onClick={handleShowDemo}
                    disabled={isLoading}
                  >
                    Demonstration
                  </button>
                  <button 
                    className="replay-button" 
                    onClick={handlePlayWordSound}
                    disabled={isLoading || isPlayingAudio}
                  >
                    {isPlayingAudio ? 'Playing...' : 'Replay'}
                  </button>
                  <button 
                    className="next-button" 
                    onClick={handleNextWord}
                    disabled={isLoading}
                  >
                    Next Word
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'demo':
        return (
          <SyllableDemoScreen 
            word={currentWord?.word || ''}
            syllables={breakIntoSyllables(
              currentWord?.word || '', 
              currentWord?.feedback?.syllable_breakdown || currentWord?.syllables
            )}
            explanation={currentWord?.syllableExplanation}
            onBack={handleBackFromDemo}
            onPlaySound={handlePlayWordSound}
          />
        );
        
      default:
        return <SyllableConfigScreen onStartGame={handleStartGame} />;
    }
  };
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={gameState}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderGameContent()}
      </motion.div>
    </AnimatePresence>
  );
}

export default SyllableClappingGame;