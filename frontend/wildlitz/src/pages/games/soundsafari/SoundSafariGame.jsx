// src/pages/games/syllable/SoundSafariGame.jsx <current update > 2025-04-24 4:12pm>
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../../styles/games/safari/SoundSafariGame.module.css';

// Placeholder character image - will be replaced with actual image path
const CharacterPlaceholder = () => (
  <div className={styles.characterPlaceholder}>🦊</div>
);

/**
 * Redesigned Sound Safari Game component
 * - No overflow/scroll (fixed viewport design)
 * - More interactive animations for children
 * - Responsive layout for any display including TVs
 * - Using teal color scheme (from uploaded colors)
 */
const SoundSafariGame = () => {
  // Game states: 'config', 'intro', 'playing', 'results', 'complete'
  const [gameState, setGameState] = useState('config');
  
  // Game configuration
  const [gameConfig, setGameConfig] = useState({
    difficulty: 'easy',
    targetSound: 's',
    soundPosition: 'beginning',
    environment: 'jungle'
  });
  
  // Game progress
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds] = useState(5);
  const [score, setScore] = useState(0);
  
  // Sample animals data (will be replaced with DB data later)
  const sampleAnimals = [
    { id: 1, name: 'Snake', image: '🐍', hasSound: 's' },
    { id: 2, name: 'Seal', image: '🦭', hasSound: 's' },
    { id: 3, name: 'Shark', image: '🦈', hasSound: 's' },
    { id: 4, name: 'Monkey', image: '🐒', hasSound: 'm' },
    { id: 5, name: 'Lion', image: '🦁', hasSound: 'l' },
    { id: 6, name: 'Tiger', image: '🐅', hasSound: 't' },
    { id: 7, name: 'Sheep', image: '🐑', hasSound: 's' },
    { id: 8, name: 'Bear', image: '🐻', hasSound: 'b' },
  ];
  
  // Selected animals for current round
  const [roundAnimals, setRoundAnimals] = useState(sampleAnimals);
  const [selectedAnimals, setSelectedAnimals] = useState([]);
  
  /**
   * Handle starting a new game with the given configuration
   */
  const handleStartGame = (config) => {
    setGameConfig(config);
    setCurrentRound(1);
    setScore(0);
    
    // Simulate loading and go to intro
    setTimeout(() => {
      setGameState('intro');
    }, 500);
  };
  
  /**
   * Handle continuing from intro to gameplay
   */
  const handleContinueFromIntro = () => {
    setGameState('playing');
  };
  
  /**
   * Handle selecting an animal during gameplay
   */
  const handleToggleSelect = (animal) => {
    setSelectedAnimals(prev => {
      // If already selected, remove it
      if (prev.some(a => a.id === animal.id)) {
        return prev.filter(a => a.id !== animal.id);
      } 
      // Otherwise add it
      return [...prev, animal];
    });
  };
  
  /**
   * Handle submitting answers
   */
  const handleSubmitAnswers = () => {
    // Calculate correct answers
    const correctAnimals = roundAnimals.filter(animal => animal.hasSound === gameConfig.targetSound);
    
    // Calculate score (percentage of correct animals found)
    const correctSelected = selectedAnimals.filter(animal => 
      animal.hasSound === gameConfig.targetSound
    ).length;
    
    const roundScore = Math.round((correctSelected / correctAnimals.length) * 100);
    
    setScore(prev => prev + roundScore);
    setGameState('results');
  };
  
  /**
   * Handle moving to next round
   */
  const handleNextRound = () => {
    if (currentRound >= totalRounds) {
      setGameState('complete');
    } else {
      setCurrentRound(prev => prev + 1);
      setSelectedAnimals([]);
      setGameState('intro');
    }
  };
  
  /**
   * Get environment background based on selected environment
   */
  const getEnvironmentClass = () => {
    switch(gameConfig.environment) {
      case 'jungle': return styles.jungleEnvironment;
      case 'savanna': return styles.savannaEnvironment;
      case 'ocean': return styles.oceanEnvironment;
      case 'arctic': return styles.arcticEnvironment;
      default: return styles.jungleEnvironment;
    }
  };
  
  return (
    <div className={`${styles.gameContainer} ${getEnvironmentClass()}`}>
      <div className={styles.gameContent}>
        <header className={styles.gameHeader}>
          <motion.div 
            className={styles.gameTitleContainer}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className={styles.gameTitle}>
              Sound Safari
              <span className={styles.gameBadge}>Adventure</span>
            </h1>
          </motion.div>
          
          {gameState !== 'config' && (
            <motion.div 
              className={styles.gameInfo}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className={styles.targetSoundBadge}>
                Target Sound: <span className={styles.soundHighlight}>{gameConfig.targetSound.toUpperCase()}</span>
              </div>
              <div className={styles.roundInfo}>
                <span>Round</span> 
                <span className={styles.roundNumbers}>{currentRound}/{totalRounds}</span>
              </div>
            </motion.div>
          )}
        </header>
        
        <AnimatePresence mode="wait">
          {gameState === 'config' && (
            <ConfigScreen 
              onStartGame={handleStartGame}
            />
          )}
          
          {gameState === 'intro' && (
            <IntroScreen 
              targetSound={gameConfig.targetSound}
              onContinue={handleContinueFromIntro}
            />
          )}
          
          {gameState === 'playing' && (
            <GameplayScreen 
              animals={roundAnimals}
              targetSound={gameConfig.targetSound}
              onToggleSelect={handleToggleSelect}
              selectedAnimals={selectedAnimals}
              onSubmit={handleSubmitAnswers}
              difficulty={gameConfig.difficulty}
            />
          )}
          
          {gameState === 'results' && (
            <ResultsScreen 
              selectedAnimals={selectedAnimals}
              correctAnimals={roundAnimals.filter(animal => animal.hasSound === gameConfig.targetSound)}
              incorrectAnimals={roundAnimals.filter(animal => animal.hasSound !== gameConfig.targetSound)}
              targetSound={gameConfig.targetSound}
              onNextRound={handleNextRound}
            />
          )}
          
          {gameState === 'complete' && (
            <CompleteScreen 
              score={score}
              totalRounds={totalRounds}
              onPlayAgain={() => setGameState('config')}
            />
          )}
        </AnimatePresence>
      </div>
      
      {/* Mascot Character */}
      <motion.div
        className={styles.mascot}
        animate={{ 
          y: [0, -15, 0],
          rotate: gameState === 'playing' ? [0, 5, 0, -5, 0] : 0
        }}
        transition={{ 
          y: { repeat: Infinity, duration: 3, ease: "easeInOut" },
          rotate: { repeat: Infinity, duration: 2, ease: "easeInOut" }
        }}
      >
        <CharacterPlaceholder />
        
        {/* Speech bubble that appears in certain game states */}
        {gameState === 'playing' && (
          <motion.div 
            className={styles.speechBubble}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p>Find the sounds!</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

/**
 * Configuration Screen Component
 */
const ConfigScreen = ({ onStartGame }) => {
  // Configuration state
  const [soundPosition, setSoundPosition] = useState('beginning');
  const [environment, setEnvironment] = useState('jungle');
  const [difficulty, setDifficulty] = useState('easy');
  
  // Available sounds for selection
  const availableSounds = [
    { letter: 's', example: 'snake, sun, seal' },
    { letter: 'm', example: 'monkey, mouse, map' },
    { letter: 't', example: 'tiger, turtle, table' },
    { letter: 'b', example: 'bear, ball, boat' },
  ];
  
  // Start game with current config
  const handleBeginGame = () => {
    const gameConfig = {
      soundPosition,
      targetSound: 's', // Default to 's' as per requirement
      environment,
      difficulty
    };
    
    onStartGame(gameConfig);
  };
  
  // Quick start with default settings
  const handleQuickStart = () => {
    const defaultConfig = {
      soundPosition: 'beginning',
      targetSound: 's',
      environment: 'jungle',
      difficulty: 'easy'
    };
    
    onStartGame(defaultConfig);
  };
  
  return (
    <motion.div 
      className={styles.configScreen}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={styles.configContent}>
        <h1 className={styles.configTitle}>
          <span>Sound Safari</span> Adventure
        </h1>
        
        <motion.button 
          className={styles.quickStartButton}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleQuickStart}
        >
          Quick Start
        </motion.button>
        
        <div className={styles.configGrid}>
          <div className={styles.configSection}>
            <h2>Sound Position</h2>
            <div className={styles.buttonGroup}>
              <motion.button 
                className={`${styles.optionButton} ${soundPosition === 'beginning' ? styles.selected : ''}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSoundPosition('beginning')}
              >
                Beginning
              </motion.button>
              
              <motion.button 
                className={`${styles.optionButton} ${soundPosition === 'middle' ? styles.selected : ''}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSoundPosition('middle')}
              >
                Middle
              </motion.button>
              
              <motion.button 
                className={`${styles.optionButton} ${soundPosition === 'ending' ? styles.selected : ''}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSoundPosition('ending')}
              >
                Ending
              </motion.button>
              
              <motion.button 
                className={`${styles.optionButton} ${soundPosition === 'anywhere' ? styles.selected : ''}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSoundPosition('anywhere')}
              >
                Anywhere
              </motion.button>
            </div>
          </div>
          
          <div className={styles.configSection}>
            <h2>Difficulty Level</h2>
            <div className={styles.buttonGroup}>
              <motion.button 
                className={`${styles.difficultyButton} ${difficulty === 'easy' ? styles.selected : ''}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDifficulty('easy')}
              >
                <span className={styles.difficultyLabel}>Easy</span>
                <span className={styles.difficultyDesc}>6 animals, 60 seconds</span>
              </motion.button>
              
              <motion.button 
                className={`${styles.difficultyButton} ${difficulty === 'medium' ? styles.selected : ''}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDifficulty('medium')}
              >
                <span className={styles.difficultyLabel}>Medium</span>
                <span className={styles.difficultyDesc}>8 animals, 45 seconds</span>
              </motion.button>
              
              <motion.button 
                className={`${styles.difficultyButton} ${difficulty === 'hard' ? styles.selected : ''}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDifficulty('hard')}
              >
                <span className={styles.difficultyLabel}>Hard</span>
                <span className={styles.difficultyDesc}>12 animals, 30 seconds</span>
              </motion.button>
            </div>
          </div>
          
          <div className={styles.configSection}>
            <h2>Environment</h2>
            <div className={styles.environmentGrid}>
              <motion.button 
                className={`${styles.environmentButton} ${styles.jungle} ${environment === 'jungle' ? styles.selected : ''}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setEnvironment('jungle')}
              >
                <span className={styles.envIcon}>🌴</span>
                <span>Jungle</span>
              </motion.button>
              
              <motion.button 
                className={`${styles.environmentButton} ${styles.savanna} ${environment === 'savanna' ? styles.selected : ''}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setEnvironment('savanna')}
              >
                <span className={styles.envIcon}>🦒</span>
                <span>Savanna</span>
              </motion.button>
              
              <motion.button 
                className={`${styles.environmentButton} ${styles.ocean} ${environment === 'ocean' ? styles.selected : ''}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setEnvironment('ocean')}
              >
                <span className={styles.envIcon}>🌊</span>
                <span>Ocean</span>
              </motion.button>
              
              <motion.button 
                className={`${styles.environmentButton} ${styles.arctic} ${environment === 'arctic' ? styles.selected : ''}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setEnvironment('arctic')}
              >
                <span className={styles.envIcon}>❄️</span>
                <span>Arctic</span>
              </motion.button>
            </div>
          </div>
        </div>
        
        <div className={styles.configActions}>
          <motion.button 
            className={styles.startButton}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBeginGame}
          >
            Start Safari
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Intro Screen Component
 */
const IntroScreen = ({ targetSound, onContinue }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Examples for the sound
  const examples = ['seal', 'sun', 'snake', 'sky'];
  
  // Play sound function
  const playSound = () => {
    setIsPlaying(true);
    // Simulate sound playing
    setTimeout(() => setIsPlaying(false), 1000);
  };
  
  return (
    <motion.div 
      className={styles.introScreen}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5 }}
    >
      <div className={styles.introCard}>
        <h2 className={styles.introTitle}>
          Listen for the Sound
          <span role="img" aria-label="Listening">👂</span>
        </h2>
        
        <div className={styles.soundCircleWrapper}>
          <motion.div 
            className={styles.soundCircle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={playSound}
          >
            <span className={styles.soundLetter}>
              {targetSound.toUpperCase()}
            </span>
            {isPlaying && (
              <div className={styles.soundWaves}>
                {[...Array(3)].map((_, i) => (
                  <motion.div 
                    key={i}
                    className={styles.soundWave}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.7, 0.3, 0]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.3
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>
          
          <motion.p 
            className={styles.tapInstruction}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Tap to hear sound
          </motion.p>
        </div>
        
        <div className={styles.examplesContainer}>
          <h3>Examples with "{targetSound}" sound:</h3>
          <div className={styles.exampleWords}>
            {examples.map((word, index) => (
              <motion.div 
                key={index} 
                className={styles.exampleWord}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + (index * 0.1) }}
              >
                <span>{word}</span>
              </motion.div>
            ))}
          </div>
        </div>
        
        <div className={styles.taskContainer}>
          <h3>Your Safari Task:</h3>
          <p>Find animals that have the "{targetSound}" sound in their names</p>
        </div>
        
        <motion.button 
          className={styles.continueButton}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onContinue}
        >
          Start the Safari!
          <span role="img" aria-label="Start">🦁</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

/**
 * Gameplay Screen Component
 */
const GameplayScreen = ({ 
  animals, 
  targetSound, 
  onToggleSelect, 
  selectedAnimals,
  onSubmit,
  difficulty
}) => {
  const [timeRemaining, setTimeRemaining] = useState(
    difficulty === 'easy' ? 60 : 
    difficulty === 'medium' ? 45 : 30
  );
  const [showHint, setShowHint] = useState(false);
  
  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Show hint temporarily
  const handleShowHint = () => {
    setShowHint(true);
    setTimeout(() => setShowHint(false), 3000);
  };
  
  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  return (
    <motion.div 
      className={styles.gameplayScreen}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={styles.gameplayCard}>
        <div className={styles.gameStatusBar}>
          <div className={styles.selectionCount}>
            <span>Selected:</span>
            <span className={styles.countNumber}>{selectedAnimals.length}</span>
          </div>
          
          <motion.button 
            className={styles.hintButton}
            onClick={handleShowHint}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span role="img" aria-label="Hint">💡</span>
            Hint
          </motion.button>
        </div>
        
        {showHint && (
          <motion.div 
            className={styles.hintBubble}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            Find animals with the "{targetSound}" sound!
          </motion.div>
        )}
        
        <div className={styles.timerContainer}>
          <div className={styles.timerLabel}>
            Time: <span className={timeRemaining < 10 ? styles.timerWarning : ''}>{formatTime(timeRemaining)}</span>
          </div>
          <div className={styles.timerBarContainer}>
            <motion.div 
              className={styles.timerBar}
              initial={{ width: '100%' }}
              animate={{ 
                width: `${(timeRemaining / (difficulty === 'easy' ? 60 : difficulty === 'medium' ? 45 : 30)) * 100}%`,
                backgroundColor: timeRemaining < 10 ? '#f44336' : '#4caf50'
              }}
              transition={{ duration: 0.5 }}
            ></motion.div>
          </div>
        </div>
        
        <div className={styles.animalsGrid}>
          {animals.map(animal => (
            <motion.div 
              key={animal.id}
              className={`${styles.animalCard} ${selectedAnimals.some(a => a.id === animal.id) ? styles.selected : ''}`}
              onClick={() => onToggleSelect(animal)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.random() * 0.5 }}
            >
              <div className={styles.animalImage}>
                {animal.image}
              </div>
              <div className={styles.animalName}>
                {animal.name}
              </div>
              {selectedAnimals.some(a => a.id === animal.id) && (
                <motion.div 
                  className={styles.checkmark}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  ✓
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
        
        <div className={styles.actionButtons}>
          <motion.button 
            className={styles.clearButton}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onToggleSelect([])}
            disabled={selectedAnimals.length === 0}
          >
            <span role="img" aria-label="Clear">🔄</span>
            Clear
          </motion.button>
          <motion.button 
            className={styles.submitButton}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSubmit}
          >
            <span role="img" aria-label="Submit">✅</span>
            Submit
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Results Screen Component
 */
const ResultsScreen = ({ 
  selectedAnimals, 
  correctAnimals, 
  incorrectAnimals, 
  targetSound, 
  onNextRound 
}) => {
  // Calculate results
  const correctSelected = selectedAnimals.filter(animal => 
    correctAnimals.some(a => a.id === animal.id)
  );
  
  const incorrectSelected = selectedAnimals.filter(animal => 
    incorrectAnimals.some(a => a.id === animal.id)
  );
  
  const missedCorrect = correctAnimals.filter(animal => 
    !selectedAnimals.some(a => a.id === animal.id)
  );
  
  // Calculate percentage score
  const score = Math.round((correctSelected.length / correctAnimals.length) * 100);
  
  // Show confetti for good scores
  const [showConfetti, setShowConfetti] = useState(score > 70);
  
  return (
    <motion.div 
      className={styles.resultsScreen}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={styles.resultsCard}>
        {showConfetti && (
          <div className={styles.confettiContainer}>
            {Array.from({ length: 50 }).map((_, i) => (
              <motion.div
                key={i}
                className={styles.confettiPiece}
                style={{
                  backgroundColor: `hsl(${Math.random() * 360}, 80%, 60%)`,
                  width: `${Math.random() * 10 + 5}px`,
                  height: `${Math.random() * 10 + 5}px`,
                  top: `-50px`,
                  left: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [`0vh`, `100vh`],
                  x: [0, Math.random() * 100 - 50],
                  rotate: [0, Math.random() * 360 * (Math.random() > 0.5 ? 1 : -1)],
                }}
                transition={{
                  duration: Math.random() * 2 + 2,
                  ease: "linear",
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>
        )}
        
        <h2 className={styles.resultsTitle}>
          <span role="img" aria-label="Results">🔍</span>
          Safari Results
        </h2>
        
        <div className={styles.scoreSection}>
          <div className={styles.scoreBanner} style={{ 
            background: score >= 70 ? 'linear-gradient(to right, #4caf50, #81c784)' : 
                       score >= 50 ? 'linear-gradient(to right, #ff9800, #ffb74d)' : 
                       'linear-gradient(to right, #f44336, #e57373)' 
          }}>
            <div className={styles.scoreInfo}>
              <div className={styles.scoreText}>
                Score: <span>{score}%</span>
              </div>
              <div className={styles.feedbackMessage}>
                <span className={styles.feedbackIcon}>
                  {score >= 90 ? '🏆' : score >= 70 ? '🌟' : score >= 50 ? '👍' : '🌱'}
                </span>
                {score >= 90 ? 'Excellent!' : score >= 70 ? 'Great Job!' : score >= 50 ? 'Good Effort!' : 'Keep Practicing!'}
              </div>
            </div>
          </div>
        </div>
        
        <div className={styles.resultsGrid}>
          <div className={styles.resultSection}>
            <h3>
              <span role="img" aria-label="Correct">✅</span>
              Correct ({correctSelected.length})
            </h3>
            <div className={styles.animalsResultGrid}>
              {correctSelected.map(animal => (
                <motion.div 
                  key={animal.id} 
                  className={styles.animalResult}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.random() * 0.3 }}
                >
                  <div className={styles.animalResultImage}>{animal.image}</div>
                  <div className={styles.animalResultName}>{animal.name}</div>
                </motion.div>
              ))}
              {correctSelected.length === 0 && (
                <div className={styles.noAnimals}>None found</div>
              )}
            </div>
          </div>
          
          <div className={styles.resultSection}>
            <h3>
              <span role="img" aria-label="Missed">🔍</span>
              Missed ({missedCorrect.length})
            </h3>
            <div className={styles.animalsResultGrid}>
              {missedCorrect.map(animal => (
                <motion.div 
                  key={animal.id} 
                  className={`${styles.animalResult} ${styles.missed}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.random() * 0.3 }}
                >
                  <div className={styles.animalResultImage}>{animal.image}</div>
                  <div className={styles.animalResultName}>{animal.name}</div>
                </motion.div>
              ))}
              {missedCorrect.length === 0 && (
                <div className={styles.noAnimals}>None missed</div>
              )}
            </div>
          </div>
        </div>
        
        <motion.button 
          className={styles.nextButton}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNextRound}
        >
          <span role="img" aria-label="Next">⏩</span>
          Next Challenge
        </motion.button>
      </div>
    </motion.div>
  );
};

/**
 * Complete Screen Component
 */
const CompleteScreen = ({ 
  score,
  totalRounds,
  onPlayAgain
}) => {
  // Calculate final score as percentage
  const finalScore = Math.round(score / totalRounds);
  const [showConfetti, setShowConfetti] = useState(finalScore >= 70);
  
  // Determine achievement level based on score
  const getAchievement = () => {
    if (finalScore >= 90) return { title: "Safari Master", emoji: "🏆", color: "#ffd700" };
    if (finalScore >= 75) return { title: "Sound Explorer", emoji: "🌟", color: "#c0ca33" };
    if (finalScore >= 60) return { title: "Animal Tracker", emoji: "🔍", color: "#29b6f6" };
    return { title: "Safari Beginner", emoji: "🌱", color: "#66bb6a" };
  };
  
  const achievement = getAchievement();
  
  return (
    <motion.div 
      className={styles.completeScreen}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {showConfetti && (
        <div className={styles.confettiContainer}>
          {Array.from({ length: 100 }).map((_, i) => (
            <motion.div
              key={i}
              className={styles.confettiPiece}
              style={{
                backgroundColor: `hsl(${Math.random() * 360}, 80%, 60%)`,
                width: `${Math.random() * 15 + 5}px`,
                height: `${Math.random() * 8 + 5}px`,
                borderRadius: Math.random() > 0.5 ? '50%' : '3px',
                top: `-50px`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [`0vh`, `100vh`],
                x: [0, Math.random() * 200 - 100],
                rotate: [0, Math.random() * 360 * (Math.random() > 0.5 ? 1 : -1)],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                ease: "linear",
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      )}
      
      <div className={styles.completeCard}>
        <motion.h2 
          className={styles.completeTitle}
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, type: 'spring' }}
        >
          <span role="img" aria-label="Complete">🎉</span>
          Safari Complete!
        </motion.h2>
        
        <motion.div 
          className={styles.trophyContainer}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, type: 'spring' }}
        >
          <motion.div 
            className={styles.trophyIcon} 
            style={{ backgroundColor: achievement.color }}
            animate={{ rotate: [-5, 5, -5, 5, 0] }}
            transition={{ 
              duration: 1,
              times: [0, 0.25, 0.5, 0.75, 1],
              ease: "easeInOut",
              delay: 1
            }}
          >
            <span>{achievement.emoji}</span>
          </motion.div>
          <div className={styles.achievementTitle} style={{ color: achievement.color }}>
            {achievement.title}
          </div>
        </motion.div>
        
        <motion.div 
          className={styles.finalScoreContainer}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className={styles.scoreCircle}>
            <svg viewBox="0 0 100 100" className={styles.scoreCircleSvg}>
              <circle 
                cx="50" cy="50" r="45" 
                fill="none" 
                stroke="#e0e0e0" 
                strokeWidth="8"
              />
              <motion.circle 
                cx="50" cy="50" r="45" 
                fill="none" 
                stroke={finalScore >= 70 ? "#4caf50" : finalScore >= 50 ? "#ff9800" : "#f44336"} 
                strokeWidth="8"
                strokeDasharray="283"
                strokeDashoffset="283"
                initial={{ strokeDashoffset: 283 }}
                animate={{ strokeDashoffset: 283 - (283 * finalScore / 100) }}
                transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }}
                style={{ transformOrigin: "center", transform: "rotate(-90deg)" }}
              />
            </svg>
            <div className={styles.scoreValue}>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3 }}
              >
                {finalScore}%
              </motion.span>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          className={styles.feedbackMessage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <p>{finalScore >= 90 ? "Amazing job! You're a true Sound Safari expert!" : 
              finalScore >= 75 ? "Great work! You've got a good ear for sounds!" :
              finalScore >= 60 ? "Good job! Keep practicing to improve your skills!" :
              "Nice try! With more practice, you'll be a sound expert!"}</p>
        </motion.div>
        
        <motion.div 
          className={styles.actionButtons}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2 }}
        >
          <motion.button 
            className={styles.playAgainButton}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onPlayAgain}
          >
            <span role="img" aria-label="Play Again">🔄</span>
            Play Again
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SoundSafariGame;