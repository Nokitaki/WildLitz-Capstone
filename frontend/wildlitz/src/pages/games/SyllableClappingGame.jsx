import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../../styles/syllable_clapping_game.css';
import LoadingOverlay from '../../components/overlays/LoadingOverlay';

const mockData = {
  easy: [
    { word: 'cat', syllables: 1, category: 'Animals' },
    { word: 'dog', syllables: 1, category: 'Animals' },
    { word: 'apple', syllables: 2, category: 'Food' },
    { word: 'tiger', syllables: 2, category: 'Animals' },
    { word: 'rabbit', syllables: 2, category: 'Animals' }
  ],
  average: [
    { word: 'elephant', syllables: 3, category: 'Animals' },
    { word: 'dinosaur', syllables: 3, category: 'Animals' },
    { word: 'computer', syllables: 3, category: 'Technology' },
    { word: 'banana', syllables: 3, category: 'Food' },
    { word: 'wonderful', syllables: 3, category: 'Adjectives' }
  ],
  difficult: [
    { word: 'alligator', syllables: 4, category: 'Animals' },
    { word: 'vocabulary', syllables: 5, category: 'Education' },
    { word: 'refrigerator', syllables: 5, category: 'Home' },
    { word: 'necessary', syllables: 4, category: 'Adjectives' },
    { word: 'calculator', syllables: 4, category: 'Technology' }
  ]
};

// Helper function to break down words into syllables (simplified for demo)
const breakIntoSyllables = (word) => {
  // This is a very simplified approximation - in a real app, you'd use a proper syllable-breaking algorithm
  const specialCases = {
    'elephant': ['el', 'e', 'phant'],
    'dinosaur': ['di', 'no', 'saur'],
    'computer': ['com', 'pu', 'ter'],
    'banana': ['ba', 'na', 'na'],
    'wonderful': ['won', 'der', 'ful'],
    'alligator': ['al', 'li', 'ga', 'tor'],
    'vocabulary': ['vo', 'cab', 'u', 'la', 'ry'],
    'refrigerator': ['re', 'frig', 'er', 'a', 'tor'],
    'necessary': ['nec', 'es', 'sa', 'ry'],
    'calculator': ['cal', 'cu', 'la', 'tor'],
    'apple': ['ap', 'ple'],
    'tiger': ['ti', 'ger'],
    'rabbit': ['rab', 'bit']
  };

  return specialCases[word.toLowerCase()] || [word];
};

// Helper function to get syllable rule for a word
const getSyllableRule = (word) => {
  // Simplified rules for demonstration
  const rules = {
    'elephant': 'When a word has a vowel sound, it creates a syllable.',
    'dinosaur': 'Each syllable typically contains one vowel sound.',
    'computer': 'Compound words often break at the boundary between the original words.',
    'banana': 'Words with double letters often break between them.',
    'wonderful': 'Prefixes and suffixes often form their own syllables.',
    'alligator': 'Look for consonant blends that might separate syllables.',
    'vocabulary': 'Words with many vowels typically have many syllables.',
    'refrigerator': 'Long words often have multiple syllables based on pronunciation patterns.',
    'necessary': 'The letter "y" can sometimes function as a vowel to create a syllable.',
    'calculator': 'Words ending in "-or" often have that as a separate syllable.'
  };

  return rules[word.toLowerCase()] || 'Each syllable contains at least one vowel sound (a, e, i, o, u).';
};

function SyllableClappingGame() {
  // Game state management
  const [loading, setLoading] = useState(true);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentWord, setCurrentWord] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(10);
  const [gameProgress, setGameProgress] = useState(0); // 0-10 for 10 words
  const [gamePhase, setGamePhase] = useState('loading'); // loading, playing, feedback
  const audioRef = useRef(null);
  
  // Initialize game
  useEffect(() => {
    // Simulating loading API data
    const loadingTimer = setTimeout(() => {
      selectWordForLevel();
      setLoading(false);
      setGamePhase('playing');
    }, 2000);
    
    return () => clearTimeout(loadingTimer);
  }, []);
  
  // Select word based on current level
  const selectWordForLevel = () => {
    let difficulty;
    if (currentLevel <= 5) {
      difficulty = 'easy';
    } else if (currentLevel <= 8) {
      difficulty = 'average';
    } else {
      difficulty = 'difficult';
    }
    
    // For demo, just cycle through the words in each difficulty
    const words = mockData[difficulty];
    const word = words[currentWordIndex % words.length];
    setCurrentWord(word);
    setUserAnswer('');
    setShowFeedback(false);
    
    // Start timer after a brief delay to allow reading
    setTimeout(() => {
      playWordAudio();
      setTimerActive(true);
    }, 1000);
  };
  
  // Handle timer countdown
  useEffect(() => {
    let timer;
    if (timerActive && timeRemaining > 0) {
      timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timerActive && timeRemaining === 0) {
      // Time's up - auto-submit
      handleSubmit();
    }
    
    return () => clearTimeout(timer);
  }, [timerActive, timeRemaining]);
  
  // Simulate playing word audio
  const playWordAudio = () => {
    console.log(`Playing audio for: ${currentWord.word}`);
    // In a real app, you would play actual audio here
    // For demo purpose, we'll just log it
    
    // Play it twice
    setTimeout(() => {
      console.log(`Playing audio for: ${currentWord.word} (repeat)`);
    }, 1500);
  };
  
  // Handle answer submission
  const handleSubmit = () => {
    setTimerActive(false);
    setGamePhase('feedback');
    setShowFeedback(true);
  };
  
  // Handle answer input
  const handleAnswerChange = (e) => {
    // Only allow numeric input
    const value = e.target.value.replace(/[^0-9]/g, '');
    setUserAnswer(value);
  };
  
  // Move to next word
  const handleNextWord = () => {
    // Increment progress
    setGameProgress(prev => Math.min(prev + 1, 10));
    
    // Check if we've completed 10 words
    if (gameProgress === 9) {
      // Game complete
      alert("Congratulations! You've completed all 10 words!");
      // In a real game, you might navigate to a results screen here
      return;
    }
    
    // Move to next word
    setCurrentWordIndex(prev => prev + 1);
    setTimeRemaining(10);
    setGamePhase('playing');
    selectWordForLevel();
  };
  
  // Replay word audio
  const handleReplay = () => {
    playWordAudio();
  };
  
  // Show hint (in feedback mode, this would show more examples)
  const handleHint = () => {
    // For demo, just log that hint was requested
    console.log("Hint requested");
    // In a real app, you might show a hint popup or syllable breakdown
  };
  
  if (loading) {
    return <LoadingOverlay isLoading={loading} />;
  }
  
  return (
    <div className="syllable-game-container">
      <div className="game-header">
        <h1>WildLitz - Syllable Clapping Game</h1>
        <div className="progress-bar-container">
          <div 
            className="progress-bar" 
            style={{ width: `${(gameProgress * 10)}%` }}
          ></div>
          <span className="progress-text">{gameProgress}/10</span>
        </div>
      </div>
      
      <div className="game-content">
        <AnimatePresence mode="wait">
          {gamePhase === 'playing' && (
            <motion.div 
              key="playing"
              className="syllable-game-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <div className="level-indicator">
                <span>{currentLevel}</span>
              </div>
              
              <h2>Listen to the word and count the syllables!</h2>
              
              <div className="word-display">
                <div className="category-label">{currentWord.category}</div>
                <div className="word-text">{currentWord.word}</div>
                <button className="sound-button" onClick={handleReplay}>
                  <span role="img" aria-label="Play sound">🔊</span>
                </button>
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
              
              <div className="timer-display">
                Time left: {timeRemaining}s
              </div>
              
              <div className="action-buttons">
                <button className="hint-button" onClick={handleHint}>Hint</button>
                <button className="replay-button" onClick={handleReplay}>Replay</button>
                <button 
                  className="continue-button" 
                  onClick={handleSubmit}
                  disabled={!userAnswer}
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}
          
          {gamePhase === 'feedback' && (
            <motion.div 
              key="feedback"
              className="syllable-game-card feedback"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <div className={`feedback-message ${parseInt(userAnswer) === currentWord.syllables ? 'correct' : 'incorrect'}`}>
                {parseInt(userAnswer) === currentWord.syllables ? 
                  `Great job! This word has ${currentWord.syllables} syllables.` :
                  `Nice try! This word has ${currentWord.syllables} syllables.`
                }
                {userAnswer && <div>Your answer: {userAnswer}</div>}
              </div>
              
              <div className="syllable-breakdown">
                {breakIntoSyllables(currentWord.word).map((syllable, index) => (
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
                <p>{getSyllableRule(currentWord.word)}</p>
                <p>
                  In "{currentWord.word}", we hear the sounds: {breakIntoSyllables(currentWord.word).join(' - ')}
                </p>
              </div>
              
              <div className="action-buttons">
                <button className="hint-button" onClick={handleHint}>More Examples</button>
                <button className="replay-button" onClick={handleReplay}>Replay</button>
                <button className="next-button" onClick={handleNextWord}>Next Word</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default SyllableClappingGame;