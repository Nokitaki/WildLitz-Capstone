import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import '../../styles/syllable_clapping_game.css';
import SyllableConfigScreen from '../../configs/SyllableConfigScreen';
import SyllableLoadingScreen from '../../components/loading/SyllableLoadingScreen';
import SyllableDemoScreen from './SyllableDemoScreen';
import wildLitzCharacter from '../../assets/img/wildlitz-idle.png';

// Mock data for words categorized by difficulty
const mockData = {
  easy: [
    { word: 'cat', syllables: 1, category: 'Animals' },
    { word: 'dog', syllables: 1, category: 'Animals' },
    { word: 'apple', syllables: 2, category: 'Food' },
    { word: 'tiger', syllables: 2, category: 'Animals' },
    { word: 'rabbit', syllables: 2, category: 'Animals' }
  ],
  medium: [
    { word: 'elephant', syllables: 3, category: 'Animals' },
    { word: 'dinosaur', syllables: 3, category: 'Animals' },
    { word: 'computer', syllables: 3, category: 'Technology' },
    { word: 'banana', syllables: 3, category: 'Food' },
    { word: 'wonderful', syllables: 3, category: 'Adjectives' }
  ],
  hard: [
    { word: 'alligator', syllables: 4, category: 'Animals' },
    { word: 'vocabulary', syllables: 5, category: 'Education' },
    { word: 'refrigerator', syllables: 5, category: 'Home' },
    { word: 'necessary', syllables: 4, category: 'Adjectives' },
    { word: 'calculator', syllables: 4, category: 'Technology' }
  ]
};

// Helper function to break down words into syllables
const breakIntoSyllables = (word) => {
  // This is a simplified approximation
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
    'rabbit': ['rab', 'bit'],
    'cat': ['cat'],
    'dog': ['dog']
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
  const navigate = useNavigate();
  
  // Game state management
  const [gameState, setGameState] = useState('config'); // config, loading, playing, feedback, demo
  const [gameConfig, setGameConfig] = useState(null);
  const [currentWord, setCurrentWord] = useState(null);
  const [gameProgress, setGameProgress] = useState(0); // 0-10 for 10 words
  const [userAnswer, setUserAnswer] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(10);
  const [timerActive, setTimerActive] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  
  const audioRef = useRef(null);
  
  // Handle starting the game after configuration
  const handleStartGame = (config) => {
    setGameConfig(config);
    setGameProgress(0);
    setGameState('loading');
    
    // Simulate loading AI-generated word
    setTimeout(() => {
      selectWordForDifficulty(config.difficulty);
    }, 2000);
  };
  
  // Select a word based on the current difficulty
  const selectWordForDifficulty = (difficulty) => {
    const words = mockData[difficulty] || mockData.easy;
    const randomIndex = Math.floor(Math.random() * words.length);
    const word = words[randomIndex];
    
    setCurrentWord(word);
    setUserAnswer('');
    setShowFeedback(false);
    setGameState('playing');
    
    // Reset timer
    setTimeRemaining(gameConfig?.timePerWord || 10);
    
    // Start timer
    setTimerActive(true);
  };
  
  // Handle the continue button in playing state
  const handleContinue = () => {
    setTimerActive(false);
    setShowFeedback(true);
    setGameState('feedback');
  };
  
  // Handle the next word button in feedback state
  const handleNextWord = () => {
    // Increment progress
    setGameProgress(prev => Math.min(prev + 1, 10));
    
    // Check if we've completed 10 words
    if (gameProgress === 9) {
      // Game complete
      alert("Congratulations! You've completed all 10 words!");
      // In a real game, you might navigate to a results screen here
      setGameState('config');
      return;
    }
    
    // Go to loading screen
    setGameState('loading');
    
    // Simulate loading next word
    setTimeout(() => {
      selectWordForDifficulty(gameConfig.difficulty);
    }, 2000);
  };
  
  // Handle the replay button (play word audio again)
  const handleReplay = () => {
    // In a real implementation, this would play the word audio
    console.log(`Playing audio for: ${currentWord.word}`);
  };
  
  // Handle changing the answer value
  const handleAnswerChange = (e) => {
    // Only allow numeric input
    const value = e.target.value.replace(/[^0-9]/g, '');
    setUserAnswer(value);
  };
  
  // Handle showing the demonstration
  const handleShowDemo = () => {
    setGameState('demo');
  };
  
  // Handle returning from demonstration to feedback
  const handleBackFromDemo = () => {
    setGameState('feedback');
  };
  
  // Handle continuing from loading to playing
  const handleContinueFromLoading = () => {
    setGameState('playing');
  };
  
  // Handle timer countdown
  useEffect(() => {
    let timer;
    if (timerActive && timeRemaining > 0) {
      timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    }
    
    return () => clearTimeout(timer);
  }, [timerActive, timeRemaining]);
  
  // Render the appropriate screen based on game state
  const renderGameContent = () => {
    switch (gameState) {
      case 'config':
        return <SyllableConfigScreen onStartGame={handleStartGame} />;
        
      case 'loading':
        return (
          <SyllableLoadingScreen 
            category={currentWord?.category || 'Animals'} 
            difficulty={gameConfig?.difficulty || 'easy'} 
            onContinue={handleContinueFromLoading}
          />
        );
        
      case 'playing':
        return (
          <div className="syllable-game-container">
            <div className="game-content-wrapper">
              <img 
                src={wildLitzCharacter} 
                alt="WildLitz Character" 
                className="wildlitz-character"
              />
              
              <div className="game-play-card">
                <div className="game-header">
                  <h1>WildLitz - Syllable Clapping Game</h1>
                  <div className="progress-container">
                    <div 
                      className="progress-bar" 
                      style={{ width: `${(gameProgress * 10)}%` }}
                    ></div>
                    <span className="progress-text">{gameProgress}/10</span>
                  </div>
                </div>
              
                <div className="level-indicator">
                  <span>{currentWord?.syllables || 3}</span>
                </div>
                
                <h2>Listen to the word and count the syllables!</h2>
                
                <div className="word-display">
                  <div className="category-label">{currentWord?.category || 'Animals'}</div>
                  <div className="word-text">{currentWord?.word || 'elephant'}</div>
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
                  <button className="hint-button">Hint</button>
                  <button className="replay-button" onClick={handleReplay}>Replay</button>
                  <button 
                    className="continue-button" 
                    onClick={handleContinue}
                    disabled={!userAnswer}
                  >
                    Continue
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
                      style={{ width: `${(gameProgress * 10)}%` }}
                    ></div>
                    <span className="progress-text">{gameProgress}/10</span>
                  </div>
                </div>
                
                <div className={`feedback-message ${parseInt(userAnswer) === currentWord?.syllables ? 'correct' : 'incorrect'}`}>
                  {parseInt(userAnswer) === currentWord?.syllables ? 
                    `Great job! This word has ${currentWord?.syllables} syllables.` :
                    `Nice try! This word has ${currentWord?.syllables} syllables.`
                  }
                  {userAnswer && <div>Your answer: {userAnswer}</div>}
                </div>
                
                <div className="syllable-breakdown">
                  {breakIntoSyllables(currentWord?.word || 'elephant').map((syllable, index) => (
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
                  <p>{getSyllableRule(currentWord?.word || 'elephant')}</p>
                  <p>
                    In "{currentWord?.word || 'elephant'}", we hear the sounds: {breakIntoSyllables(currentWord?.word || 'elephant').join(' - ')}
                  </p>
                </div>
                
                <div className="action-buttons">
                  <button className="hint-button" onClick={handleShowDemo}>Demonstration</button>
                  <button className="replay-button" onClick={handleReplay}>Replay</button>
                  <button className="next-button" onClick={handleNextWord}>Next Word</button>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'demo':
        return (
          <SyllableDemoScreen 
            word={currentWord?.word || 'elephant'}
            syllables={breakIntoSyllables(currentWord?.word || 'elephant')}
            onBack={handleBackFromDemo}
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