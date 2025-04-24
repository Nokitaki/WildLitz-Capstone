// src/pages/games/syllable/SyllableClappingGame.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from '../../../styles/games/syllable/SyllableClappingGame.module.css';
import SyllableConfigScreen from './SyllableConfigScreen';
import SyllableDemoScreen from './SyllableDemoScreen';
import CompletionScreen from './CompletionScreen';
import SyllableLoadingScreen from './SyllableLoadingScreen';
import Character from '../../../assets/img/wildlitz-idle.png';
import WordTransitionScreen from './WordTransitionScreen';

const SyllableClappingGame = () => {
  const navigate = useNavigate();
  
  // Game state management
  const [gamePhase, setGamePhase] = useState('config'); // config, loading, playing, feedback, demo, complete
  const [gameConfig, setGameConfig] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [speakingSyllable, setSpeakingSyllable] = useState(null);

  const [currentWord, setCurrentWord] = useState({
    word: "",
    syllables: "",
    count: 0,
    category: "",
    image_url: null,
    fun_fact: "",
    intro_message: ""
  });
  const [clapCount, setClapCount] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(1);
  const [totalWords, setTotalWords] = useState(10);
  const [gameStats, setGameStats] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleMessage, setBubbleMessage] = useState("");
  const [aiResponse, setAiResponse] = useState(null);
  const [syllableTip, setSyllableTip] = useState("");
  
  // Button disabling states
  const [checkButtonDisabled, setCheckButtonDisabled] = useState(false);
  const [nextButtonDisabled, setNextButtonDisabled] = useState(false);
  const [demoButtonDisabled, setDemoButtonDisabled] = useState(false);
  
  // Track correct answers
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [startTime, setStartTime] = useState(null);
  
  // Card flip state
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  
  // Instead of making an API call, use these hardcoded tips
  const getSyllableTip = (difficulty) => {
    const tips = {
      'easy': [
        "Listen for the beat in each word - every beat is a syllable!",
        "Clap as you say each word part to count syllables.",
        "Every syllable has one vowel sound."
      ],
      'medium': [
        "Put your hand under your chin - each time your jaw drops is a syllable!",
        "Break words into chunks by listening for vowel sounds.",
        "Try singing the word slowly to hear each syllable."
      ],
      'hard': [
        "Compound words often have syllables from each original word.",
        "Long words can be broken down into smaller parts to count syllables.",
        "Focus on vowel sounds - each syllable has exactly one vowel sound."
      ]
    };
    
    const difficultyTips = tips[difficulty.toLowerCase()] || tips['medium'];
    return difficultyTips[Math.floor(Math.random() * difficultyTips.length)];
  };

  const handleQuit = () => {
    // Show a confirmation if needed
    if (window.confirm("Are you sure you want to quit? Your progress will be lost.")) {
      navigate('/home'); // Navigate to home page
    }
  };

  const handleSyllablePronunciation = (syllable) => {
    // Set the currently speaking syllable for visual feedback
    setSpeakingSyllable(syllable);
    
    // Use slow speech rate by default
    const rate = 0.5;
    
    // Get syllable array and find index
    const syllableArray = currentWord.syllables.split('-');
    const syllableIndex = syllableArray.indexOf(syllable);
    
    // Get the correct pronunciation using our helper
    const textToSpeak = getPronunciationForSyllable(syllable, syllableIndex, currentWord);
    
    console.log(`Speaking syllable "${syllable}" with pronunciation "${textToSpeak}"`);
    
    // Try to use browser's text-to-speech
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(textToSpeak.trim());
      utterance.rate = rate;
      
      utterance.onend = () => {
        setSpeakingSyllable(null);
      };
      
      utterance.onerror = () => {
        setSpeakingSyllable(null);
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      // Fallback if speech synthesis is not available
      console.warn('Text-to-speech not supported in this browser');
      setTimeout(() => {
        setSpeakingSyllable(null);
      }, 1000);
    }
  };

  const renderSyllableButtons = () => {
    // Safety check
    if (!currentWord || !currentWord.syllables) {
      return <div className={styles.syllables}>No syllables available</div>;
    }
    
    const syllableArray = currentWord.syllables.split('-');
    
    return (
      <div className={styles.syllables}>
        {syllableArray.map((syllable, index) => {
          // Get the pronunciation for this syllable
          const pronunciation = getPronunciationForSyllable(syllable, index, currentWord);
          
          return (
            <button 
              key={index} 
              className={`${styles.syllableButton} ${speakingSyllable === syllable ? styles.speaking : ''}`}
              onClick={() => handleSyllablePronunciation(syllable)}
              disabled={speakingSyllable !== null}
            >
              {syllable}
              {pronunciation !== syllable && (
                <span className={styles.syllablePronunciation}>({pronunciation})</span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const validateWordData = (wordData) => {
    // Check for required fields
    if (!wordData.word || !wordData.syllables) {
      console.error('Word data missing critical fields:', wordData);
      return false;
    }
    
    // Check syllable breakdown
    const syllables = wordData.syllables.split('-');
    if (syllables.length !== wordData.count) {
      console.warn(`Syllable count mismatch: breakdown has ${syllables.length} but count is ${wordData.count}`);
    }
    
    // Check pronunciation guide if available
    if (wordData.pronunciation_guide) {
      try {
        const pronunciations = wordData.pronunciation_guide.split('-');
        if (pronunciations.length !== syllables.length) {
          console.warn(`Pronunciation guide segments (${pronunciations.length}) don't match syllable count (${syllables.length})`);
        }
      } catch (error) {
        console.error('Error parsing pronunciation guide:', error);
        return false;
      }
    }
    
    return true;
  };

  // Fetch a new word from the API
  const fetchNewWord = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use the selected difficulty and categories from gameConfig
      const difficulty = gameConfig?.difficulty || 'medium';
      const categories = gameConfig?.categories || [];
      
      // Build query string for categories
      const categoryParams = categories.map(cat => `categories[]=${encodeURIComponent(cat)}`).join('&');
      
      // Call API to get a word with AI-generated content
      const response = await axios.get(
        `http://127.0.0.1:8000/api/syllabification/get-word-supabase/?difficulty=${difficulty}&${categoryParams}`
      );
      
      const wordData = response.data;
      
      // Validate the word data
      if (!validateWordData(wordData)) {
        console.warn('Word data validation failed, but continuing with available data');
      }
      
      // Debug pronunciation guide specifically
      console.log('Pronunciation guide:', wordData.pronunciation_guide);
      
      // First update state with the new word
      setCurrentWord({
        word: wordData.word,
        syllables: wordData.syllables,
        count: wordData.count,
        category: wordData.category,
        image_url: wordData.image_url || null,
        pronunciation_guide: wordData.pronunciation_guide || wordData.syllables, // Fall back to syllables if no guide
        fun_fact: wordData.fun_fact || `Fun fact about ${wordData.word}: This is a ${wordData.category.toLowerCase()} with ${wordData.count} syllables!`,
        intro_message: wordData.intro_message || `Listen to "${wordData.word}" and count the syllables!`
      });
      
      // Then set the bubble message from the AI-generated intro
      setBubbleMessage(wordData.intro_message || `Listen to "${wordData.word}" and count the syllables!`);
      
    } catch (err) {
      setError('Failed to load word. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // State to store all preloaded words
  const [gameWords, setGameWords] = useState([]);
  const [wordIndex, setWordIndex] = useState(0);
  
  // Check answer with the AI feedback
  const checkAnswerWithAI = async () => {
    // Disable the check button to prevent multiple clicks
    setCheckButtonDisabled(true);
    
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/syllabification/check-syllable-answer/', {
        word: currentWord.word,
        syllables: currentWord.syllables,
        clapCount: clapCount,
        correctCount: currentWord.count
      });
      
      setAiResponse(response.data);
      
      // Update bubble message with AI feedback
      setBubbleMessage(response.data.feedback_message);
      
      // Update correct answers count
      if (response.data.is_correct) {
        setCorrectAnswers(prev => prev + 1);
      }
      
      // Move to feedback phase
      setGamePhase('feedback');
      setShowBubble(true);
      
    } catch (error) {
      console.error("Error checking answer:", error);
      
      // Fallback to basic feedback without AI
      const isCorrect = clapCount === currentWord.count;
      setBubbleMessage(
        isCorrect
          ? "Great job! That's correct!"
          : "Nice try! Listen again."
      );
      
      if (isCorrect) {
        setCorrectAnswers(prev => prev + 1);
      }
      
      setGamePhase('feedback');
      setShowBubble(true);
    }
    
    // Enable the check button after a delay (6 seconds)
    setTimeout(() => {
      setCheckButtonDisabled(false);
    }, 6000);
  };
  
  // Request AI pronunciation guidance for the demo screen
  const fetchPronunciationGuide = async () => {
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/syllabification/get-syllable-pronunciation/', {
        word: currentWord.word,
        syllables: currentWord.syllables
      });
      
      return response.data;
    } catch (error) {
      console.error("Error fetching pronunciation guide:", error);
      return null;
    }
  };
  
  // Show welcome message when a new word starts
  useEffect(() => {
    if (gamePhase === 'playing') {
      // Show message and bubble
      setShowBubble(true);
      
      // Hide bubble after 6 seconds
      const bubbleTimer = setTimeout(() => {
        setShowBubble(false);
      }, 6000);
      
      // Show image flip at the start
      setIsFlipped(true);
      setIsFlipping(true);
      
      // Auto flip back to word after 3 seconds
      const flipTimer = setTimeout(() => {
        setIsFlipped(false);
        setIsFlipping(true);
        
        // After flipping back to word, wait a moment then play the sound
        const audioTimer = setTimeout(() => {
          // Make sure we have the current word before trying to play it
          if (currentWord && currentWord.word) {
            // Play the word using TTS
            handlePlaySound(); // <-- Use your existing function
          }
        }, 500);
        
        // Clean up the audio timer
        return () => clearTimeout(audioTimer);
      }, 3000);
      
      return () => {
        clearTimeout(bubbleTimer);
        clearTimeout(flipTimer);
      };
    }
  }, [gamePhase]);
  
  // Handle card flip transition end
  const handleFlipTransitionEnd = () => {
    setIsFlipping(false);
  };
  
  // Handle manual card flip
  const handleCardFlip = () => {
    if (!isFlipping) {
      setIsFlipped(!isFlipped);
      setIsFlipping(true);
    }
  };
  
  // Handle starting the game from config screen
  const handleStartGame = async (config) => {
    setGameConfig(config);
    
    // Initialize game stats
    setCorrectAnswers(0);
    setStartTime(new Date());
    setTotalWords(config.questionCount || 10);
    
    // Set a tip using our hardcoded function
    const gameTip = getSyllableTip(config.difficulty);
    setSyllableTip(gameTip);
    
    // Show loading screen before preloading words
    setGamePhase('loading');
    
    // Preload all words first - IMPORTANT: capture the returned words
    const words = await preloadGameWords(config);
    
    if (words && words.length > 0) {
      // Use the words array directly instead of relying on gameWords state
      
      // Set the current word explicitly using the first word from the returned array
      const firstWord = words[0];
      setCurrentWord({
        word: firstWord.word,
        syllables: firstWord.syllables,
        count: firstWord.count,
        category: firstWord.category,
        image_url: firstWord.image_url || null,
        fun_fact: firstWord.fun_fact || `Fun fact about ${firstWord.word}!`,
        intro_message: firstWord.intro_message || `Let's listen and count the syllables!`
      });
      
      // Set bubble message
      setBubbleMessage(firstWord.intro_message || `Let's listen and count the syllables!`);
      
      // Transition to playing phase
      setGamePhase('playing');
    } else {
      // Handle error - words couldn't be loaded
      console.error("Failed to load word data");
      setError('Could not load game data. Please try different settings or reload the page.');
    }
  };
  
  const playWordWithTTS = (word) => {
    if (!word) {
      console.warn('Attempted to play TTS for empty word');
      return;
    }
    
    setIsPlaying(true);
    
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.35; // Slightly slower for clarity
      
      utterance.onend = () => {
        setIsPlaying(false);
      };
      
      utterance.onerror = () => {
        setIsPlaying(false);
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      // Fallback if speech synthesis is not available
      console.warn('Text-to-speech not supported in this browser');
      setTimeout(() => setIsPlaying(false), 2000);
    }
  };


  // Handle clap button press
  const handleClap = () => {
    setClapCount(prev => prev + 1);
  };
  
  // Handle play sound button
  const handlePlaySound = () => {
    // Get the current word directly from state
    const word = currentWord?.word;
    
    // Safety check to ensure we have a valid word
    if (!word) {
      console.warn('Attempted to play sound for undefined word');
      return;
    }
    
    setIsPlaying(true);
    
    // Use text-to-speech to read the current word
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      // For word playback, we use the word directly, not the pronunciation guide
      // This is because we want users to hear the actual word, not the phonetic breakdown
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.35; // Slightly slower for clarity
      
      utterance.onend = () => {
        setIsPlaying(false);
      };
      
      utterance.onerror = () => {
        setIsPlaying(false);
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      // Fallback if speech synthesis is not available
      console.warn('Text-to-speech not supported in this browser');
      // Simulate audio playing for 2 seconds
      setTimeout(() => setIsPlaying(false), 2000);
    }
  };

  const getPronunciationForSyllable = (syllable, syllableIndex, word) => {
    // Safety checks
    if (!word || !word.syllables || !word.pronunciation_guide) {
      return syllable; // Fall back to the syllable itself
    }
    
    try {
      // Get the correct syllable and pronunciation arrays
      const syllables = word.syllables.split('-');
      const pronunciations = word.pronunciation_guide.split('-');
      
      // Validate that we have the correct syllable at the expected index
      if (syllableIndex >= 0 && syllableIndex < syllables.length && 
          syllables[syllableIndex] === syllable && 
          syllableIndex < pronunciations.length) {
        return pronunciations[syllableIndex];
      }
    } catch (error) {
      console.error('Error parsing pronunciation guide:', error);
    }
    
    // Default fallback
    return syllable;
  };
  
  // Handle checking the answer
  const handleCheckAnswer = () => {
    // Only process if the button is not disabled
    if (!checkButtonDisabled) {
      checkAnswerWithAI();
    }
  };
  
  // Helper function to truncate long messages
  const truncateMessage = (message, maxLength) => {
    if (!message) return '';
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };
  
  // Handle showing the demo screen
  const handleShowDemo = async () => {
    // Disable the demo button to prevent multiple clicks
    setDemoButtonDisabled(true);
    
    // Generate word-specific pronunciation guide
    const pronunciationData = await fetchPronunciationGuide();
    
    // Generate a demo-specific character message
    try {
      const messageResponse = await axios.post('http://127.0.0.1:8000/api/syllabification/generate-ai-content/', {
        type: 'character_message',
        word: currentWord.word,
        context: 'demo'
      });
      
      if (messageResponse.data && messageResponse.data.content) {
        // Add the message to the pronunciation data
        if (pronunciationData) {
          // Truncate message if it's too long to prevent UI glitches
          const message = messageResponse.data.content;
          pronunciationData.character_message = truncateMessage(message, 120);
        }
      }
    } catch (error) {
      console.error("Error generating demo character message:", error);
      // Add a default message if the API call fails
      if (pronunciationData) {
        pronunciationData.character_message = `Let's learn how to pronounce "${currentWord.word}" syllable by syllable!`;
      }
    }
    
    // Store the pronunciation data to pass to demo screen
    setCurrentWord(prev => ({
      ...prev,
      pronunciationGuide: pronunciationData
    }));
    
    setGamePhase('demo');
    
    // Re-enable the demo button after 6 seconds
    setTimeout(() => {
      setDemoButtonDisabled(false);
    }, 3000);
  };
  
  // Handle going back from demo to feedback
  const handleBackFromDemo = () => {
    setGamePhase('feedback');
    // Show feedback bubble again when returning from demo
    setShowBubble(true);
  };
  
  // Calculate elapsed time in MM:SS format
  const getElapsedTime = () => {
    if (!startTime) return '0:00';
    
    const now = new Date();
    const elapsed = Math.floor((now - startTime) / 1000); // seconds
    
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Function to properly set up the next word
  const setupNextWord = (nextWordIndex) => {
    // Get the next word data
    const nextWordData = gameWords[nextWordIndex];
    if (!nextWordData) return false;
    
    // Log the word data being loaded
    console.log('Setting up next word:', nextWordData);
    console.log('Pronunciation guide for next word:', nextWordData.pronunciation_guide);
    
    // Reset all related states
    setClapCount(0);
    setAiResponse(null);
    
    // Update the current word - ensure all fields are properly populated
    setCurrentWord({
      word: nextWordData.word,
      syllables: nextWordData.syllables,
      count: nextWordData.count,
      category: nextWordData.category,
      image_url: nextWordData.image_url || null,
      pronunciation_guide: nextWordData.pronunciation_guide || nextWordData.syllables, // Ensure we have some guide
      fun_fact: nextWordData.fun_fact || `Fun fact about ${nextWordData.word}!`,
      intro_message: nextWordData.intro_message || `Listen to "${nextWordData.word}" and count the syllables!`
    });
    
    // Update bubble message for the new word
    setBubbleMessage(nextWordData.intro_message || `Listen to "${nextWordData.word}" and count the syllables!`);
    
    // Log the current word state after update
    console.log('Current word state updated:', {
      word: nextWordData.word,
      syllables: nextWordData.syllables,
      pronunciation_guide: nextWordData.pronunciation_guide || nextWordData.syllables
    });
    
    return true;
  };
  

  const handleNextWord = () => {
    // Disable the next button to prevent multiple clicks
    setNextButtonDisabled(true);
    
    // Increase the word index
    const nextIndex = currentIndex + 1;
    
    // Check if we've completed all words
    if (nextIndex > totalWords) {
      // Game is complete, calculate stats
      const accuracy = Math.round((correctAnswers / totalWords) * 100);
      
      const gameStats = {
        totalWords: totalWords,
        correctAnswers: correctAnswers,
        accuracy: `${accuracy}%`,
        difficulty: gameConfig?.difficulty || 'Medium',
        completionTime: getElapsedTime()
      };
      
      setGameStats(gameStats);
      setGamePhase('complete');
      setNextButtonDisabled(false);
      return;
    }
    
    // First completely reset any answer-related states
    setClapCount(0);
    setAiResponse(null);
    
    // Update index counter
    setCurrentIndex(nextIndex);
    
    // Generate a new tip for this transition
    const gameTip = getSyllableTip(gameConfig?.difficulty || 'medium');
    setSyllableTip(gameTip);
    
    // Show the word transition screen overlay
    setGamePhase('wordTransition');
    
    // Wait 1.5 seconds with the transition screen
    setTimeout(() => {
      // Advance to the next word index
      const newWordIndex = wordIndex + 1;
      setWordIndex(newWordIndex);
      
      // Explicitly set the current word to the new word
      const wordData = gameWords[newWordIndex];
      if (wordData) {
        // Update the current word explicitly
        setCurrentWord({
          word: wordData.word,
          syllables: wordData.syllables,
          count: wordData.count,
          category: wordData.category,
          image_url: wordData.image_url || null,
          pronunciation_guide: wordData.pronunciation_guide || wordData.syllables, // Make sure to include pronunciation guide
          fun_fact: wordData.fun_fact || `Fun fact about ${wordData.word}!`,
          intro_message: wordData.intro_message || `Let's listen and count the syllables!`
        });
        
        // Set bubble message
        setBubbleMessage(wordData.intro_message || `Let's listen and count the syllables!`);
      }
      
      // Now change to playing phase
      setGamePhase('playing');
      
      // Re-enable the next button
      setNextButtonDisabled(false);
      
      // Show the bubble for the new word
      setShowBubble(true);
      
      // Auto hide bubble after 6 seconds
      setTimeout(() => {
        setShowBubble(false);
      }, 6000);
      
      // Auto-play the word only after the card flip animation
      setTimeout(() => {
        // First the card flips to show the image (3 seconds)
        // Then it flips back to show the word
        setTimeout(() => {
          if (wordData && wordData.word) {
            // Cancel any ongoing speech
            if ('speechSynthesis' in window) {
              window.speechSynthesis.cancel();
              
              const utterance = new SpeechSynthesisUtterance(wordData.word);
              utterance.rate = 0.35; // Slightly slower for clarity
              
              setIsPlaying(true);
              
              utterance.onend = () => {
                setIsPlaying(false);
              };
              
              utterance.onerror = () => {
                setIsPlaying(false);
              };
              
              window.speechSynthesis.speak(utterance);
            }
          }
        }, 3500); // Wait for card flip animation to complete
      }, 100);
    }, 1500);
  };

  // Load the current word from the preloaded array
  const loadCurrentWord = () => {
    if (gameWords.length === 0 || wordIndex >= gameWords.length) {
      setError('No more words available. Please start a new game.');
      return false;
    }
    
    try {
      const wordData = gameWords[wordIndex];
      
      if (!wordData) {
        console.error(`No word data found at index ${wordIndex}`);
        setError('Failed to load word data. Please try again.');
        return false;
      }
      
      // Update state with the current word
      setCurrentWord({
        word: wordData.word || 'example',
        syllables: wordData.syllables || 'ex-am-ple',
        count: wordData.count || 3,
        category: wordData.category || 'Default',
        image_url: wordData.image_url || null,
        pronunciation_guide: wordData.pronunciation_guide || wordData.syllables || 'ex-am-ple', // Make sure to include pronunciation guide
        fun_fact: wordData.fun_fact || `Fun fact about words!`,
        intro_message: wordData.intro_message || `Let's listen and count the syllables!`
      });
      
      // Set the bubble message from the AI-generated intro
      setBubbleMessage(wordData.intro_message || `Let's listen and count the syllables!`);
      
      return true;
    } catch (error) {
      console.error('Error loading current word:', error);
      setError('An error occurred while loading the word. Please try again.');
      return false;
    }
  };
  
  // Preload all words for the game session
  const preloadGameWords = async (config) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use the selected difficulty and categories from config
      const difficulty = config?.difficulty || 'medium';
      const categories = config?.categories || [];
      const wordCount = config?.questionCount || 10;
      
      console.log("Preloading with config:", {difficulty, categories, wordCount});
      
      // Build query string for categories
      const categoryParams = categories.map(cat => `categories[]=${encodeURIComponent(cat)}`).join('&');
      
      const url = `http://127.0.0.1:8000/api/syllabification/get-word-batch/?difficulty=${difficulty}&${categoryParams}&count=${wordCount}`;
      console.log("API URL:", url);
      
      // Call API to get a batch of words with AI-generated content
      const response = await axios.get(url);
      
      const wordsData = response.data.words;
      console.log("Received words:", wordsData?.length || 0);
      
      if (wordsData && wordsData.length > 0) {
        // Check for duplicates in the received data
        const wordSet = new Set();
        const uniqueWords = [];
        
        // Filter out any duplicates in the response
        for (const word of wordsData) {
          if (!wordSet.has(word.word)) {
            wordSet.add(word.word);
            
            // Ensure image_url is null if it's an empty string
            if (word.image_url === '') {
              word.image_url = null;
            }
            
            uniqueWords.push(word);
          } else {
            console.warn(`Duplicate word detected in API response: ${word.word}`);
          }
        }
        
        console.log(`Unique words after filtering: ${uniqueWords.length} (removed ${wordsData.length - uniqueWords.length} duplicates)`);
        
        // Shuffle the array to randomize word order
        const shuffledWords = [...uniqueWords].sort(() => Math.random() - 0.5);
        
        // Set state for future use
        setGameWords(shuffledWords);
        setWordIndex(0);
        
        // IMPORTANT CHANGE: Return the words array directly
        return shuffledWords;
      } else {
        setError('Could not load enough words. Please try different settings.');
        return null;
      }
    } catch (err) {
      console.error('Error preloading words:', err);
      setError('Failed to load words. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };  
  
  // Fallback message if API fails
  const getFallbackMessage = () => {
    return `Let's listen and count the syllables!`;
  };

  const renderQuitButton = () => {
  // Only show the quit button during actual gameplay phases
  if (gamePhase === 'playing' || gamePhase === 'feedback') {
    return (
      <button 
        className={styles.quitButton}
        onClick={handleQuit}
      >
        <span>←</span>
        Quit Game
      </button>
    );
  }
  return null; // Don't render the button for other phases
};

const debugPronunciationGuide = () => {
  // Log the current word state
  console.group('Pronunciation Guide Debug');
  console.log('Current word:', currentWord);
  
  if (!currentWord) {
    console.error('Current word not defined');
    console.groupEnd();
    return;
  }
  
  console.log('Word:', currentWord.word);
  console.log('Syllables:', currentWord.syllables);
  console.log('Pronunciation guide:', currentWord.pronunciation_guide);
  
  // Check if pronunciation guide exists
  if (!currentWord.pronunciation_guide) {
    console.warn('Pronunciation guide is missing or undefined');
    console.groupEnd();
    return;
  }
  
  // Check if syllables and pronunciation guide have the same format
  const syllables = currentWord.syllables.split('-');
  const pronunciations = currentWord.pronunciation_guide.split('-');
  
  console.log('Syllable count:', syllables.length);
  console.log('Pronunciation segments count:', pronunciations.length);
  
  // Compare each syllable with its pronunciation
  console.log('Syllable to pronunciation mapping:');
  syllables.forEach((syllable, index) => {
    const pronunciation = index < pronunciations.length ? pronunciations[index] : 'MISSING';
    console.log(`Syllable ${index + 1}: "${syllable}" → Pronunciation: "${pronunciation}"`);
  });
  
  console.groupEnd();
};
  
  // Render Playing Phase
  const renderPlayingPhase = () => {
    return (
      <div className={styles.gameContainer}>
        {/* Game Header */}
        <div className={styles.gameHeader}>
          <h1>Syllable Clapping Game</h1>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${(currentIndex / totalWords) * 100}%` }}
            />
            <span className={styles.progressText}>{currentIndex}/{totalWords}</span>
          </div>
        </div>
        
        {/* Main Game Area */}
        <div className={styles.gameArea}>
          {/* Character on the Left */}
          <div className={styles.characterSide}>
            <div className={styles.characterWrapper}>
              <img src={Character} alt="WildLitz Character" className={styles.character} />
              
              {/* Feedback bubble below character */}
              {showBubble && (
                <div className={styles.feedbackBubble}>
                  {bubbleMessage || getFallbackMessage()}
                </div>
              )}
            </div>
            
            <div className={styles.gameInfo}>
              <div className={styles.infoItem}>
                <span>Category:</span>
                <span>{currentWord.category}</span>
              </div>
              <div className={styles.infoItem}>
                <span>Difficulty:</span>
                <span>{gameConfig?.difficulty || 'Medium'}</span>
              </div>
            </div>
          </div>
          
          {/* Word Display in Center - With flip effect */}
          <div 
            className={`${styles.wordSection} ${isFlipped ? styles.flipped : ''}`}
            onClick={handleCardFlip}
            onTransitionEnd={handleFlipTransitionEnd}
          >
            {/* Front side - Word information */}
            <div className={styles.cardFront}>
              <div className={styles.wordImageContainer}>
                <div className={styles.wordImage}>
                  {currentWord.image_url ? (
                    <img 
                      src={currentWord.image_url} 
                      alt={currentWord.word} 
                      className={styles.realImage}
                    />
                  ) : (
                    <div className={styles.placeholderImage}>
                      <span>🖼️</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className={styles.wordDisplay}>
                <h2>{currentWord.word}</h2>
                <button 
                  className={`${styles.playButton} ${isPlaying ? styles.playing : ''}`}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card flip when clicking button
                    handlePlaySound();
                  }}
                  disabled={isPlaying}
                >
                  <span className={styles.soundIcon}>🔊</span>
                  <span>{isPlaying ? 'Playing...' : 'Listen Again'}</span>
                </button>
              </div>
              
              <div className={styles.flipInstruction}>
                Click to see image
              </div>
            </div>
            
            {/* Back side - Real image */}
            <div className={styles.cardBack}>
              <div className={styles.realImageContainer}>
                {currentWord.image_url ? (
                  <img 
                    src={currentWord.image_url} 
                    alt={currentWord.word} 
                    className={styles.realImage}
                  />
                ) : (
                  <div className={styles.placeholderImage}>
                    <span>No image available</span>
                  </div>
                )}
              </div>
              <div className={styles.funFactContainer}>
                <span className={styles.funFactIcon}>💡</span>
                <div className={styles.funFact}>
                  {currentWord.fun_fact}
                </div>
              </div>
              <div className={styles.flipInstruction}>
                Click to see word
              </div>
            </div>
          </div>
          
          {/* Clap Area on Right */}
          <div className={styles.clapSection}>
            <p className={styles.instructions}>Clap for each syllable!</p>
            
            <button 
              className={styles.clapButton}
              onClick={handleClap}
            >
              <span className={styles.clapIcon}>👏</span>
            </button>
            
            <div className={styles.clapCountDisplay}>
              <span className={styles.clapCount}>{clapCount}</span>
              <span className={styles.clapLabel}>claps</span>
              
              {/* Add reset button here */}
              <button 
                className={styles.resetButton}
                onClick={() => setClapCount(0)}
                title="Reset claps"
              >
                <span className={styles.resetIcon}>🔄</span>
              </button>
            </div>
            
            <button 
              className={`${styles.checkButton} ${checkButtonDisabled ? styles.disabled : ''}`}
              onClick={handleCheckAnswer}
              disabled={clapCount === 0 || checkButtonDisabled}
            >
              {checkButtonDisabled ? 'Checking...' : 'Check Answer'}
            </button>
          </div>
        </div>
        
        {/* Loading and Error States */}
        {isLoading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading next word...</p>
          </div>
        )}
        
        {error && (
          <div className={styles.errorMessage}>
            <p>{error}</p>
            <button onClick={fetchNewWord}>Try Again</button>
          </div>
        )}
      </div>
    );
  };
  
  // Render Feedback Phase
  const renderFeedbackPhase = () => {
    return (
      <div className={styles.gameContainer}>
        {/* Game Header */}
        <div className={styles.gameHeader}>
          <h1>Syllable Clapping Game</h1>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${(currentIndex / totalWords) * 100}%` }}
            />
            <span className={styles.progressText}>{currentIndex}/{totalWords}</span>
          </div>
        </div>
        
        {/* Feedback Game Area */}
        <div className={styles.gameArea}>
          {/* Character on the Left */}
          <div className={styles.characterSide}>
            <div className={styles.characterWrapper}>
              <img src={Character} alt="WildLitz Character" className={styles.character} />
              
              {/* Feedback bubble below character */}
              {showBubble && (
                <div className={`${styles.feedbackBubble} ${clapCount === currentWord.count ? styles.correct : styles.incorrect}`}>
                  {bubbleMessage}
                </div>
              )}
            </div>
            
            {/* Game info stays at the bottom */}
            <div className={styles.gameInfo}>
              <div className={styles.infoItem}>
                <span>Category:</span>
                <span>{currentWord.category}</span>
              </div>
              <div className={styles.infoItem}>
                <span>Difficulty:</span>
                <span>{gameConfig?.difficulty || 'Medium'}</span>
              </div>
            </div>
          </div>
          
          {/* Word and Image - With flip effect */}
          <div 
            className={`${styles.wordSection} ${isFlipped ? styles.flipped : ''}`}
            onClick={handleCardFlip}
            onTransitionEnd={handleFlipTransitionEnd}
          >
            {/* Front side - Word information */}
            <div className={styles.cardFront}>
              <div className={styles.wordImageContainer}>
                <div className={styles.wordImage}>
                  {currentWord.image_url ? (
                    <img 
                      src={currentWord.image_url} 
                      alt={currentWord.word} 
                      className={styles.realImage}
                    />
                  ) : (
                    <div className={styles.placeholderImage}>
                      <span>🖼️</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className={styles.wordDisplay}>
                <h2>{currentWord.word}</h2>
                <div className={styles.resultDisplay}>
                  {clapCount === currentWord.count ? 
                    <span className={styles.correctResult}>✅ Correct!</span> : 
                    <span className={styles.incorrectResult}>
                      ⚠️ {currentWord.word} has {currentWord.count} syllables
                    </span>
                  }
                </div>
              </div>
              
              <div className={styles.flipInstruction}>
                Click to see image
              </div>
            </div>
            
            {/* Back side - Real image */}
            <div className={styles.cardBack}>
              <div className={styles.realImageContainer}>
                {currentWord.image_url ? (
                  <img 
                    src={currentWord.image_url} 
                    alt={currentWord.word} 
                    className={styles.realImage}
                  />
                ) : (
                  <div className={styles.placeholderImage}>
                    <span>No image available</span>
                  </div>
                )}
              </div>
              <div className={styles.funFactContainer}>
                <span className={styles.funFactIcon}>💡</span>
                <div className={styles.funFact}>
                  {currentWord.fun_fact}
                </div>
              </div>
              <div className={styles.flipInstruction}>
                Click to see word
              </div>
            </div>
          </div>
          
          {/* Syllable Breakdown */}
          <div className={styles.syllableSection}>
          <h3>Syllable Breakdown</h3>
          
          <div className={styles.syllables}>
            {currentWord.syllables.split('-').map((syllable, index) => {
              // Get the corresponding pronunciation guide if available
              let pronunciation = syllable;
              if (currentWord.pronunciation_guide) {
                try {
                  const guides = currentWord.pronunciation_guide.split('-');
                  if (guides.length > index) {
                    pronunciation = guides[index];
                  }
                } catch (error) {
                  console.error(`Error parsing pronunciation for ${syllable}:`, error);
                }
              }
              
              return (
                <button 
                  key={index} 
                  className={`${styles.syllableButton} ${speakingSyllable === syllable ? styles.speaking : ''}`}
                  onClick={() => handleSyllablePronunciation(syllable)}
                  disabled={speakingSyllable !== null}
                  title={`Pronunciation: ${pronunciation}`}
                >
                  {syllable}
                  {pronunciation !== syllable && (
                    <span className={styles.syllablePronunciation}>{pronunciation}</span>
                  )}
                </button>
              );
            })}
          </div>
                    
          {/* AI Feedback Section */}
          <div className={styles.aiFeedbackSection}>
            <div className={styles.aiFeedbackTitle}>
              <span>🤖</span> AI Learning Assistant
            </div>
            <div className={styles.aiFeedbackContent}>
              In "{currentWord.word}", we hear {currentWord.count} distinct syllables: {currentWord.syllables}. 
              Each syllable has one vowel sound. Try clapping slowly as you say {currentWord.syllables} to feel each syllable!
            </div>
          </div>
          
          <div className={styles.actionButtons}>
            <button 
              className={`${styles.demoButton} ${demoButtonDisabled ? styles.disabled : ''}`}
              onClick={handleShowDemo}
              disabled={demoButtonDisabled}
            >
              {demoButtonDisabled ? 'Loading Demo...' : 'Sound Demo'}
            </button>
            
            <button 
              className={`${styles.nextButton} ${nextButtonDisabled ? styles.disabled : ''}`}
              onClick={handleNextWord}
              disabled={nextButtonDisabled}
            >
              {nextButtonDisabled ? 'Loading...' : (currentIndex === totalWords ? 'See Results' : 'Next Word')}
            </button>
          </div>
        </div>
        </div>
      </div>
    );
  };
  
  // Render the appropriate component based on game phase
  const renderGameContent = () => {
    switch(gamePhase) {
      case 'config':
        return <SyllableConfigScreen onStartGame={handleStartGame} />;
        
      case 'loading':
        const displayDifficulty = gameConfig?.difficulty || 'Medium';
  
        return <SyllableLoadingScreen 
                 difficulty={displayDifficulty}
                 wordIndex={currentIndex}
                 totalWords={totalWords}
                 tip={syllableTip}
               />;
      
      case 'wordTransition':
        return (
          <>
            {renderPlayingPhase()}
            <WordTransitionScreen 
              wordIndex={currentIndex}
              totalWords={totalWords}
              tip={syllableTip}
            />
          </>
        );
        
      case 'playing':
        return renderPlayingPhase();
        
      case 'feedback':
        return renderFeedbackPhase();
        
      case 'demo':
        return <SyllableDemoScreen 
                 word={currentWord} 
                 onBack={handleBackFromDemo} 
                 pronunciationGuide={currentWord.pronunciationGuide}
               />;
        
      case 'complete':
        return <CompletionScreen stats={gameStats} onPlayAgain={handlePlayAgain} onGoHome={handleGoHome} />;
        
      default:
        return <SyllableConfigScreen onStartGame={handleStartGame} />;
    }
  };
  
  // Handle playing again
  const handlePlayAgain = () => {
    setGamePhase('config');
    setClapCount(0);
    setCurrentIndex(1);
    setCorrectAnswers(0);
    setStartTime(null);
    setGameWords([]);
    setWordIndex(0);
  };
  
  // Handle returning to home
  const handleGoHome = () => {
    navigate('/home');
  };
  
  return (
  <div className={styles.container}>
    {renderQuitButton()}
    {renderGameContent()}
  </div>
);
};

export default SyllableClappingGame;
