// src/pages/games/soundsafari/GameplayScreen/index.jsx <updated on 2025-04-25>

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import styles from '../../../../styles/games/safari/SoundSafari.module.css';

// Import sub-components
import HintBubble from './HintBubble';
import TimerDisplay from './TimerDisplay';
import AnimalCard from './AnimalCard';

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
  const [showHint, setShowHint] = useState(false);
  const [isPlaying, setIsPlaying] = useState(null);
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

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>
          <span role="img" aria-label="Sound Safari" className={styles.headerEmoji}>🔍</span>
          Sound Safari Hunt
        </h2>
        <p className={styles.cardSubtitle}>
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
      
      <HintBubble 
        visibleHint={visibleHint} 
        showHint={showHint} 
      />
      
      <TimerDisplay 
        timeRemaining={timeRemaining} 
        timeLimit={timeLimit} 
      />
      
      <div className={styles.animalsGrid}>
        {animals.map(animal => (
          <AnimalCard
            key={animal.id}
            animal={animal}
            isSelected={selectedAnimals.some(a => a.id === animal.id)}
            onToggleSelect={handleToggleSelect}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
          />
        ))}
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
  );
};

export default GameplayScreen;