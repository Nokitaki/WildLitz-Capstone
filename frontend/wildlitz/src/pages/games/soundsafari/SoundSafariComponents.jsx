// SoundSafariComponents.jsx - 

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { SOUND_EXAMPLES, SOUND_DESCRIPTIONS } from '../../../mock/soundSafariData';
import styles from '../../../styles/SoundSafari.module.css';

/**
 * Component for introducing the target sound to players
 */
const SoundIntroScreen = ({ targetSound, onContinue }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // Get examples for this target sound
  const examples = SOUND_EXAMPLES[targetSound] || [];
  
  // Get sound description
  const soundDescription = SOUND_DESCRIPTIONS[targetSound] || 'Listen carefully for this sound';

  // Play sound function
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

  // Play example word
  const playExampleWord = (word) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className={styles.introScreen}>
      <h2 className={styles.introTitle}>Listen for the sound:</h2>
      
      <div className={styles.soundCircle}>
        <span className={styles.soundLetter}>
          {targetSound.toUpperCase()} {targetSound.toLowerCase()}
        </span>
      </div>
      
      <motion.button 
        className={styles.playButton}
        onClick={playSound}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        disabled={isPlaying}
      >
        {isPlaying ? 'Playing...' : 'Tap to hear the sound'}
      </motion.button>
      
      <div className={styles.soundDescription}>
        <h3>How to make this sound:</h3>
        <p>{soundDescription}</p>
      </div>
      
      <div className={styles.exampleBox}>
        <h3>Example words with the "{targetSound}" Sound:</h3>
        <div className={styles.exampleWords}>
          {examples.slice(0, 4).map((word, index) => (
            <div key={index} className={styles.exampleWord}>
              <span>{word}</span>
              <motion.button 
                className={styles.smallPlayButton}
                onClick={() => playExampleWord(word)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                🔊
              </motion.button>
            </div>
          ))}
          {examples.length > 4 && (
            <button className={styles.moreExamplesButton}>More examples</button>
          )}
        </div>
      </div>
      
      <div className={styles.taskBox}>
        <h4>Your task:</h4>
        <p>Find animals that contain the "{targetSound}" sound</p>
      </div>
      
      <motion.button 
        className={styles.continueButton}
        onClick={onContinue}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Start the Safari!
      </motion.button>
    </div>
  );
};

/**
 * Component for the main gameplay screen where users select animals
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
  const timerRef = useRef(null);

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

  // Play animal name
  const playAnimalSound = (e, animal) => {
    e.stopPropagation(); // Prevent toggling selection when playing sound
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(animal.name);
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className={styles.gameplayScreen}>
      <div className={styles.gameHeader}>
        <div className={styles.gameTask}>
          Find animals with the "{targetSound}" Sound!
        </div>
        <div className={styles.selectionInfo}>
          Selected {selectedAnimals.length}/{animals.length}
        </div>
      </div>
      
      {timeLimit > 0 && (
        <div className={styles.timerContainer}>
          <div className={styles.timerBar} style={{ 
            width: `${(timeRemaining / timeLimit) * 100}%` 
          }}></div>
          <span className={styles.timerText}>{formatTime(timeRemaining)}</span>
        </div>
      )}
      
      <div className={styles.animalsGrid}>
        {animals.map(animal => (
          <motion.div 
            key={animal.id}
            className={`${styles.animalCard} ${selectedAnimals.some(a => a.id === animal.id) ? styles.selected : ''}`}
            onClick={() => handleToggleSelect(animal)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
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
              >
                🔊
              </motion.button>
            </div>
            {selectedAnimals.some(a => a.id === animal.id) && (
              <div className={styles.checkmark}>
                ✓
              </div>
            )}
          </motion.div>
        ))}
      </div>
      
      <div className={styles.actionButtons}>
        <motion.button 
          className={styles.cancelButton}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSelectedAnimals([])}
        >
          Cancel
        </motion.button>
        <motion.button 
          className={styles.submitButton}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
        >
          Submit Answer
        </motion.button>
      </div>
    </div>
  );
};

/**
 * Component for displaying results after submitting answers
 */
const ResultsScreen = ({ 
  selectedAnimals, 
  correctAnimals, 
  incorrectAnimals, 
  targetSound, 
  onNextRound, 
  onTryAgain 
}) => {
  const correctCount = selectedAnimals.filter(animal => 
    correctAnimals.some(a => a.id === animal.id)
  ).length;
  
  // Calculate percentage score
  const score = Math.round((correctCount / correctAnimals.length) * 100);
  
  // Determine feedback message based on score
  const getFeedbackMessage = () => {
    if (score >= 90) return "Excellent Work!";
    if (score >= 70) return "Great Job!";
    if (score >= 50) return "Good Effort!";
    return "Keep Practicing!";
  };

  // Play celebration sound for high scores
  useEffect(() => {
    if (score > 70) {
      const audio = new Audio('/sounds/celebration.mp3');
      audio.volume = 0.5;
      audio.play().catch(err => console.error("Error playing sound:", err));
    }
  }, []);

  // Play animal name 
  const playAnimalSound = (animal) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(animal.name);
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <motion.div 
      className={styles.resultsScreen}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className={styles.confetti}
        initial={{ opacity: 0 }}
        animate={{ opacity: score >= 70 ? 1 : 0 }}
      >
        {/* Confetti animation for high scores */}
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className={styles.confettiPiece}
            style={{
              backgroundColor: `hsl(${Math.random() * 360}, 80%, 60%)`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, Math.random() * 500 + 100],
              x: [0, (Math.random() - 0.5) * 200],
              rotate: [0, Math.random() * 360],
            }}
            transition={{
              duration: Math.random() * 2 + 2,
              ease: "linear",
              repeat: Infinity,
              repeatType: "loop",
              delay: Math.random() * 2,
            }}
          />
        ))}
      </motion.div>
      
      <div className={styles.resultHeader}>
        <motion.h2 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {`Good Job! You found ${correctCount}/${correctAnimals.length} animals with the "${targetSound}" Sound!`}
        </motion.h2>
        <motion.div 
          className={styles.scoreDisplay}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Score: {score}% - {getFeedbackMessage()}
        </motion.div>
      </div>
      
      <div className={styles.resultsContainer}>
        <motion.div 
          className={styles.correctAnimals}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3>You correctly found these animals with the "{targetSound}" Sound:</h3>
          <div className={styles.animalResults}>
            {correctAnimals.filter(animal => 
              selectedAnimals.some(a => a.id === animal.id)
            ).map(animal => (
              <div key={animal.id} className={styles.resultAnimal}>
                <span className={styles.playIcon} onClick={() => playAnimalSound(animal)}>🔊</span>
                {animal.name}
              </div>
            ))}
          </div>
        </motion.div>
        
        <motion.div 
          className={styles.incorrectAnimals}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h3>Animals without the sound of "{targetSound}":</h3>
          <div className={styles.animalResults}>
            {incorrectAnimals.filter(animal => 
              selectedAnimals.some(a => a.id === animal.id)
            ).map(animal => (
              <div key={animal.id} className={styles.resultAnimal}>
                <span className={styles.playIcon} onClick={() => playAnimalSound(animal)}>🔊</span>
                {animal.name}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
      
      <div className={styles.teacherTip}>
        <h4>Teacher Tip:</h4>
        <p>Ask the students to make the "{targetSound}" sound and find other words that have this sound.</p>
      </div>
      
      <div className={styles.resultActions}>
        <motion.button 
          className={styles.tryAgainButton}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onTryAgain}
        >
          Try Again
        </motion.button>
        <motion.button 
          className={styles.nextButton}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNextRound}
        >
          Next Challenge
        </motion.button>
      </div>
    </motion.div>
  );
};

/**
 * Component for the game completion screen
 */
const GameCompleteScreen = ({ 
  score,
  totalRounds,
  onPlayAgain,
  onChangeDifficulty
}) => {
  // Calculate final score as percentage
  const finalScore = Math.round(score / totalRounds);
  
  return (
    <div className={styles.completeScreen}>
      <h2>Safari Complete!</h2>
      <div className={styles.finalScore}>
        <h3>Your Final Score:</h3>
        <div className={styles.scoreValue}>
          {finalScore}%
        </div>
        
        {finalScore >= 80 ? (
          <div className={styles.highScoreBadge}>
            <span role="img" aria-label="Trophy">🏆</span> Great Job!
          </div>
        ) : (
          <div className={styles.encouragement}>
            Keep practicing! You're getting better!
          </div>
        )}
      </div>
      
      <div className={styles.completeActions}>
        <button 
          className={styles.playAgainButton}
          onClick={onPlayAgain}
        >
          Play Again
        </button>
        
        <button 
          className={styles.changeDifficultyButton}
          onClick={onChangeDifficulty}
        >
          Change Difficulty
        </button>
      </div>
    </div>
  );
};

export {
  SoundIntroScreen,
  GameplayScreen,
  ResultsScreen,
  GameCompleteScreen
};