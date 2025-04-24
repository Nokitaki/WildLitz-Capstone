// src/pages/games/syllable/SoundSafariComponents.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { SOUND_EXAMPLES, SOUND_DESCRIPTIONS } from '../../../mock/soundSafariData';
import styles from '../../../styles/games/safari/SoundSafari.module.css';

/**
 * Component for introducing the target sound to players
 * Redesigned with no overflow/scroll for TV display
 */
const SoundIntroScreen = ({ targetSound, onContinue }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeExample, setActiveExample] = useState(null);

  // Get examples for this target sound
  const examples = SOUND_EXAMPLES[targetSound] || [];
  
  // Get sound description
  const soundDescription = SOUND_DESCRIPTIONS[targetSound] || 'Listen carefully for this sound';

  // Play sound function with animation
  const playSound = () => {
    setIsPlaying(true);
    // Use speech synthesis to pronounce the sound
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(targetSound);
      utterance.rate = 0.7;
      utterance.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    } else {
      // Fallback if speech synthesis isn't available
      setTimeout(() => setIsPlaying(false), 1000);
    }
  };

  // Play example word with animation
  const playExampleWord = (word) => {
    setActiveExample(word);
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.8;
      utterance.onend = () => setActiveExample(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setActiveExample(null), 1000);
    }
  };

  return (
    <motion.div 
      className={styles.introScreenContainer}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={styles.introCard}>
        <div className={styles.introHeader}>
          <h2 className={styles.introTitle}>
            Listen for the Sound
            <span role="img" aria-label="Listening" className={styles.headerEmoji}>👂</span>
          </h2>
          <p className={styles.introSubtitle}>Learn to identify the "{targetSound}" sound</p>
        </div>
        
        <div className={styles.soundCircleWrapper}>
          <motion.div 
            className={styles.soundCircle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={playSound}
          >
            <span className={styles.soundLetter}>
              {targetSound.toUpperCase()} {targetSound.toLowerCase()}
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
        
        <div className={styles.infoContainer}>
          <div className={styles.soundDescription}>
            <div className={styles.sectionTitle}>
              <span role="img" aria-label="How to" className={styles.titleEmoji}>🔤</span>
              <h3>How to make this sound:</h3>
            </div>
            <div className={styles.descriptionBox}>
              <p>{soundDescription}</p>
            </div>
          </div>
          
          <motion.div 
            className={styles.examplesContainer}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className={styles.sectionTitle}>
              <span role="img" aria-label="Examples" className={styles.titleEmoji}>✨</span>
              <h3>Example words with "{targetSound}" sound:</h3>
            </div>
            
            <div className={styles.exampleWords}>
              {examples.slice(0, 4).map((word, index) => (
                <motion.div 
                  key={index} 
                  className={`${styles.exampleWord} ${activeExample === word ? styles.activeExample : ''}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => playExampleWord(word)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + (index * 0.1) }}
                >
                  <span>{word}</span>
                  <motion.div 
                    className={styles.playIcon}
                    animate={activeExample === word ? { 
                      scale: [1, 1.2, 1],
                      color: ['#81c9c0', '#a0dad1', '#81c9c0'] 
                    } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    🔊
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
        
        <div className={styles.taskContainer}>
          <div className={styles.sectionTitle}>
            <span role="img" aria-label="Task" className={styles.titleEmoji}>🎯</span>
            <h3>Your Safari Task:</h3>
          </div>
          <div className={styles.taskBox}>
            <p>Find animals that have the "{targetSound}" sound in their names</p>
          </div>
        </div>
        
        <motion.button 
          className={styles.continueButton}
          whileHover={{ scale: 1.05, boxShadow: "0 8px 16px rgba(0,0,0,0.2)" }}
          whileTap={{ scale: 0.95 }}
          onClick={onContinue}
        >
          Start the Safari!
          <span role="img" aria-label="Start" className={styles.buttonEmoji}>🦁</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

/**
 * Component for the main gameplay screen where users select animals
 * Redesigned with no overflow/scroll for TV display
 */
const GameplayScreen = ({ 
  animals, 
  targetSound, 
  soundPosition, 
  onSubmit, 
  timeLimit 
}) => {
  const [selectedAnimals, setSelectedAnimals] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [showHint, setShowHint] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [visibleHint, setVisibleHint] = useState('');
  const timerRef = useRef(null);
  const hintTimeoutRef = useRef(null);

  useEffect(() => {
    // Set up timer
    if (timeLimit > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    // Clear timer on unmount
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    };
  }, [timeLimit]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeRemaining === 0) {
      handleSubmit();
    }
  }, [timeRemaining]);

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

  const handleSubmit = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    onSubmit(selectedAnimals);
  };

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Display a temporary hint
  const showTemporaryHint = () => {
    let hint = '';
    switch(soundPosition) {
      case 'beginning':
        hint = `Look for animals that start with "${targetSound}"`;
        break;
      case 'ending':
        hint = `Look for animals that end with "${targetSound}"`;
        break;
      case 'middle':
        hint = `Look for animals that have "${targetSound}" in the middle`;
        break;
      default:
        hint = `Look for animals that have "${targetSound}" anywhere in their name`;
    }
    
    setVisibleHint(hint);
    setShowHint(true);
    
    // Clear previous timeout if it exists
    if (hintTimeoutRef.current) {
      clearTimeout(hintTimeoutRef.current);
    }
    
    // Hide hint after 3 seconds
    hintTimeoutRef.current = setTimeout(() => {
      setShowHint(false);
    }, 3000);
  };

  // Play animal name
  const playAnimalSound = (e, animal) => {
    e.stopPropagation(); // Prevent toggling selection when playing sound
    
    setIsPlaying(true);
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(animal.name);
      utterance.rate = 0.8;
      utterance.onend = () => {
        setIsPlaying(false);
      };
      window.speechSynthesis.speak(utterance);
    } else {
      // Simple fallback if speech synthesis isn't available
      setTimeout(() => setIsPlaying(false), 1000);
    }
  };

  return (
    <motion.div 
      className={styles.gameplayScreenContainer}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={styles.gameplayCard}>
        <div className={styles.gameplayHeader}>
          <h2 className={styles.gameplayTitle}>
            <span role="img" aria-label="Sound Safari" className={styles.headerEmoji}>🔍</span>
            Sound Safari Hunt
          </h2>
          <p className={styles.gameplaySubtitle}>
            Find the animals with the <span className={styles.targetSoundText}>"{targetSound}"</span> sound!
          </p>
        </div>
        
        <div className={styles.gameStatusBar}>
          <div className={styles.selectionCount}>
            <span className={styles.countLabel}>Selected:</span>
            <span className={styles.countNumber}>{selectedAnimals.length}/{animals.length}</span>
          </div>
          
          <motion.button 
            className={styles.hintButton}
            onClick={showTemporaryHint}
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
            {visibleHint}
          </motion.div>
        )}
        
        {timeLimit > 0 && (
          <div className={styles.timerContainer}>
            <div className={styles.timerLabel}>
              Time: <span className={timeRemaining < 10 ? styles.timerWarning : ''}>{formatTime(timeRemaining)}</span>
            </div>
            <div className={styles.timerBarContainer}>
              <motion.div 
                className={styles.timerBar}
                initial={{ width: '100%' }}
                animate={{ 
                  width: `${(timeRemaining / timeLimit) * 100}%`,
                  backgroundColor: timeRemaining < 10 ? '#f44336' : '#81c9c0'
                }}
                transition={{ duration: 0.5 }}
              ></motion.div>
            </div>
          </div>
        )}
        
        <div className={styles.animalsGridWrapper}>
          <div className={styles.animalsGrid}>
            {animals.map(animal => (
              <motion.div 
                key={animal.id}
                className={`${styles.animalCard} ${selectedAnimals.some(a => a.id === animal.id) ? styles.selected : ''}`}
                onClick={() => handleToggleSelect(animal)}
                whileHover={{ scale: 1.05, boxShadow: "0 8px 16px rgba(0,0,0,0.2)" }}
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
                  <motion.button 
                    className={styles.soundButton}
                    onClick={(e) => playAnimalSound(e, animal)}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    disabled={isPlaying}
                  >
                    {isPlaying ? '🔊' : '🔊'}
                  </motion.button>
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
        </div>
        
        <div className={styles.actionButtons}>
          <motion.button 
            className={styles.clearButton}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedAnimals([])}
            disabled={selectedAnimals.length === 0}
          >
            <span role="img" aria-label="Clear">🔄</span>
            Clear Selection
          </motion.button>
          <motion.button 
            className={styles.submitButton}
            whileHover={{ scale: 1.05, boxShadow: "0 8px 16px rgba(0,0,0,0.2)" }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
          >
            <span role="img" aria-label="Submit">✅</span>
            Submit Answer
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Component for displaying results after submitting answers
 * Redesigned with no overflow/scroll for TV display
 */
const ResultsScreen = ({ 
  selectedAnimals, 
  correctAnimals, 
  incorrectAnimals, 
  targetSound, 
  onNextRound, 
  onTryAgain 
}) => {
  const [isPlaying, setIsPlaying] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  
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
  
  // Determine feedback message based on score
  const getFeedbackMessage = () => {
    if (score >= 90) return "Excellent Work!";
    if (score >= 70) return "Great Job!";
    if (score >= 50) return "Good Effort!";
    return "Keep Practicing!";
  };
  
  // Get feedback icon based on score
  const getFeedbackIcon = () => {
    if (score >= 90) return "🏆";
    if (score >= 70) return "🌟";
    if (score >= 50) return "👍";
    return "🌱";
  };

  // Play celebration sound for high scores
  useEffect(() => {
    if (score > 70) {
      setShowConfetti(true);
      
      // Play audio feedback
      try {
        // Simple sound effect
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Play a few happy notes
        [0, 4, 7, 12].forEach((note, index) => {
          const oscillator = audioContext.createOscillator();
          oscillator.type = 'triangle';
          oscillator.frequency.value = 440 * Math.pow(2, note / 12); // A major scale
          
          const gainNode = audioContext.createGain();
          gainNode.gain.value = 0.1;
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.start(audioContext.currentTime + index * 0.15);
          oscillator.stop(audioContext.currentTime + 0.2 + index * 0.15);
        });
      } catch (e) {
        console.log('Audio not supported');
      }
    }
  }, [score]);

  // Play animal name 
  const playAnimalSound = (animal) => {
    if (isPlaying) return;
    
    setIsPlaying(animal.id);
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(animal.name);
      utterance.rate = 0.8;
      utterance.onend = () => setIsPlaying(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsPlaying(null), 1000);
    }
  };

  return (
    <motion.div 
      className={styles.resultsScreenContainer}
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
        
        <div className={styles.resultsHeader}>
          <h2 className={styles.resultsTitle}>
            <span role="img" aria-label="Results" className={styles.headerEmoji}>🔍</span>
            Safari Results
          </h2>
        </div>
        
        <div className={styles.scoreSection}>
          <div className={styles.scoreBanner} style={{ 
            background: score >= 70 ? 'linear-gradient(to right, #81c9c0, #a0dad1)' : 
                       score >= 50 ? 'linear-gradient(to right, #ff9800, #ffb74d)' : 
                       'linear-gradient(to right, #f44336, #e57373)' 
          }}>
            <div className={styles.scoreInfo}>
              <div className={styles.scoreText}>
                Score: <span>{score}%</span>
              </div>
              <div className={styles.feedbackMessage}>
                <span className={styles.feedbackIcon}>{getFeedbackIcon()}</span>
                {getFeedbackMessage()}
              </div>
            </div>
            <div className={styles.scoreDetails}>
              You found {correctSelected.length} of {correctAnimals.length} animals with the "{targetSound}" sound!
            </div>
          </div>
        </div>
        
        <div className={styles.resultsContainer}>
          <div className={styles.resultSection}>
            <div className={styles.sectionHeader}>
              <span role="img" aria-label="Correct" className={styles.sectionIcon}>✅</span>
              <h3>Correct Answers!</h3>
            </div>
            {correctSelected.length > 0 ? (
              <div className={styles.resultsAnimalsGrid}>
                {correctSelected.map(animal => (
                  <motion.div 
                    key={animal.id} 
                    className={styles.animalResult}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: Math.random() * 0.3 + 0.1 }}
                    onClick={() => playAnimalSound(animal)}
                  >
                    <div className={styles.animalResultIcon}>
                      {animal.image}
                    </div>
                    <div className={styles.animalResultInfo}>
                      <div className={styles.animalResultName}>
                        {animal.name}
                        <motion.div 
                          className={styles.soundIcon}
                          animate={isPlaying === animal.id ? { 
                            scale: [1, 1.2, 1],
                            color: ['#81c9c0', '#a0dad1', '#81c9c0']
                          } : {}}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        >
                          🔊
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyMessage}>
                <p>You didn't find any animals with the "{targetSound}" sound.</p>
              </div>
            )}
          </div>
          
          {incorrectSelected.length > 0 && (
            <div className={styles.resultSection}>
              <div className={styles.sectionHeader}>
                <span role="img" aria-label="Incorrect" className={styles.sectionIcon}>❌</span>
                <h3>Incorrect Choices</h3>
              </div>
              <div className={styles.resultsAnimalsGrid}>
                {incorrectSelected.map(animal => (
                  <motion.div 
                    key={animal.id} 
                    className={`${styles.animalResult} ${styles.incorrect}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: Math.random() * 0.3 + 0.1 }}
                    onClick={() => playAnimalSound(animal)}
                  >
                    <div className={styles.animalResultIcon}>
                      {animal.image}
                    </div>
                    <div className={styles.animalResultInfo}>
                      <div className={styles.animalResultName}>
                        {animal.name}
                        <motion.div 
                          className={styles.soundIcon}
                          animate={isPlaying === animal.id ? { 
                            scale: [1, 1.2, 1],
                            color: ['#81c9c0', '#a0dad1', '#81c9c0']
                          } : {}}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        >
                          🔊
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          
          {missedCorrect.length > 0 && (
            <div className={styles.resultSection}>
              <div className={styles.sectionHeader}>
                <span role="img" aria-label="Missed" className={styles.sectionIcon}>🔍</span>
                <h3>You Missed These</h3>
              </div>
              <div className={styles.resultsAnimalsGrid}>
                {missedCorrect.map(animal => (
                  <motion.div 
                    key={animal.id} 
                    className={`${styles.animalResult} ${styles.missed}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: Math.random() * 0.3 + 0.1 }}
                    onClick={() => playAnimalSound(animal)}
                  >
                    <div className={styles.animalResultIcon}>
                      {animal.image}
                    </div>
                    <div className={styles.animalResultInfo}>
                      <div className={styles.animalResultName}>
                        {animal.name}
                        <motion.div 
                          className={styles.soundIcon}
                          animate={isPlaying === animal.id ? { 
                            scale: [1, 1.2, 1],
                            color: ['#81c9c0', '#a0dad1', '#81c9c0']
                          } : {}}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        >
                          🔊
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className={styles.teacherTip}>
          <div className={styles.tipHeader}>
            <span role="img" aria-label="Teacher tip" className={styles.tipIcon}>💡</span>
            <h4>Teacher Tip:</h4>
          </div>
          <p>Ask students to think of other words that have the "{targetSound}" sound and create their own animal names using this sound!</p>
        </div>
        
        <div className={styles.actionButtons}>
          <motion.button 
            className={styles.tryAgainButton}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onTryAgain}
          >
            <span role="img" aria-label="Try Again">🔄</span>
            Try Again
          </motion.button>
          <motion.button 
            className={styles.nextButton}
            whileHover={{ scale: 1.05, boxShadow: "0 8px 16px rgba(0,0,0,0.2)" }}
            whileTap={{ scale: 0.95 }}
            onClick={onNextRound}
          >
            <span role="img" aria-label="Next">⏩</span>
            Next Challenge
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Component for the game completion screen
 * Redesigned with no overflow/scroll for TV display
 */
const GameCompleteScreen = ({ 
  score,
  totalRounds,
  onPlayAgain,
  onChangeDifficulty
}) => {
  // Calculate final score as percentage
  const finalScore = Math.round(score / totalRounds);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Determine achievement level based on score
  const getAchievement = () => {
    if (finalScore >= 90) return { title: "Safari Master", emoji: "🏆", color: "#81c9c0" };
    if (finalScore >= 75) return { title: "Sound Explorer", emoji: "🌟", color: "#a0dad1" };
    if (finalScore >= 60) return { title: "Animal Tracker", emoji: "🔍", color: "#a0d6e3" };
    return { title: "Safari Beginner", emoji: "🌱", color: "#a5d6a7" };
  };
  
  const achievement = getAchievement();
  
  // Play celebration effects
  useEffect(() => {
    // Show confetti for good scores
    if (finalScore >= 70) {
      setShowConfetti(true);
      
      // Play victory sound
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create a victory melody
        const notes = [0, 4, 7, 12, 7, 12];
        notes.forEach((note, index) => {
          const oscillator = audioContext.createOscillator();
          oscillator.type = 'triangle';
          oscillator.frequency.value = 440 * Math.pow(2, note / 12); // A major scale
          
          const gainNode = audioContext.createGain();
          gainNode.gain.value = 0.1;
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.start(audioContext.currentTime + index * 0.2);
          oscillator.stop(audioContext.currentTime + 0.15 + index * 0.2);
        });
      } catch (e) {
        console.log('Audio not supported');
      }
    }
  }, [finalScore]);
  
  // Get feedback message based on score
  const getFeedbackMessage = () => {
    if (finalScore >= 90) return "Amazing job! You're a true Sound Safari expert!";
    if (finalScore >= 75) return "Great work! You've got a good ear for sounds!";
    if (finalScore >= 60) return "Good job! Keep practicing to improve your skills!";
    return "Nice try! With more practice, you'll be a sound expert!";
  };
  
  // Get tip based on score
  const getTip = () => {
    if (finalScore >= 90) return "Challenge yourself with higher difficulty levels!";
    if (finalScore >= 75) return "Try a harder difficulty to test your skills!";
    if (finalScore >= 60) return "Keep practicing to recognize sounds faster!";
    return "Listen carefully to the sounds and practice with different words!";
  };
  
  return (
    <motion.div 
      className={styles.completeScreenContainer}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={styles.completeCard}>
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
        
        <motion.h2 
          className={styles.completeTitle}
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, type: 'spring' }}
        >
          <span role="img" aria-label="Complete" className={styles.headerEmoji}>🎉</span>
          Safari Complete!
        </motion.h2>
        
        <motion.div 
          className={styles.trophyContainer}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, type: 'spring' }}
        >
          {/* Trophy icon with achievement level */}
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
                stroke={finalScore >= 70 ? "#81c9c0" : finalScore >= 50 ? "#ff9800" : "#f44336"} 
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
          <p>{getFeedbackMessage()}</p>
        </motion.div>
        
        <motion.div 
          className={styles.tipContainer}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8 }}
        >
          <div className={styles.tipHeader}>
            <span role="img" aria-label="Tip" className={styles.tipIcon}>💡</span>
            <h3>Pro Tip:</h3>
          </div>
          <p>{getTip()}</p>
        </motion.div>
        
        <motion.div 
          className={styles.actionButtons}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2 }}
        >
          <motion.button 
            className={styles.playAgainButton}
            whileHover={{ scale: 1.05, boxShadow: "0 8px 16px rgba(0,0,0,0.2)" }}
            whileTap={{ scale: 0.95 }}
            onClick={onPlayAgain}
          >
            <span role="img" aria-label="Play Again" className={styles.buttonIcon}>🔄</span>
            Play Again
          </motion.button>
          
          <motion.button 
            className={styles.changeDifficultyButton}
            whileHover={{ scale: 1.05, boxShadow: "0 8px 16px rgba(0,0,0,0.2)" }}
            whileTap={{ scale: 0.95 }}
            onClick={onChangeDifficulty}
          >
            <span role="img" aria-label="Difficulty" className={styles.buttonIcon}>⚙️</span>
            Change Difficulty
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export {
  SoundIntroScreen,
  GameplayScreen,
  ResultsScreen,
  GameCompleteScreen
};