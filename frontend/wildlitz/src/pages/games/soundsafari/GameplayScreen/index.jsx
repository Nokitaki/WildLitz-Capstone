// src/pages/games/soundsafari/GameplayScreen/index.jsx <updated on 2025-04-27>

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import styles from '../../../../styles/games/safari/GameplayScreen.module.css';
import { playSpeech } from '../../../../utils/soundUtils';
import WildLitzFox from '../../../../assets/img/wildlitz-idle.png';

/**
 * Component for the main gameplay screen
 * Redesigned with horizontal layout and no overflow/scroll
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
  const [showIntro, setShowIntro] = useState(true);
  const [highlightedAnimal, setHighlightedAnimal] = useState(null);
  const [introPlayed, setIntroPlayed] = useState(false);
  const timerRef = useRef(null);
  
  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Get position text
  const getPositionText = () => {
    switch(soundPosition) {
      case 'beginning': return 'at the beginning';
      case 'middle': return 'in the middle';
      case 'ending': return 'at the end';
      default: return 'anywhere';
    }
  };
  
  // Generate character intro speech
  const getCharacterIntro = () => {
    const positionText = getPositionText();
    return `Let's find the animals with the "${targetSound}" sound ${positionText} of their names! Listen carefully and select all the matching animals.`;
  };
  
  // Play intro speech when component mounts
  useEffect(() => {
    if (!introPlayed) {
      const introSpeech = getCharacterIntro();
      // Small delay to ensure component is fully mounted
      setTimeout(() => {
        playSpeech(introSpeech, 0.9, () => {
          setIntroPlayed(true);
          setShowIntro(false);
          
          // Start introducing each animal with a small delay
          setTimeout(() => {
            introduceAnimals();
          }, 500);
        });
      }, 300);
    }
  }, [introPlayed]);
  
  // Function to introduce animals one by one with TTS
  const introduceAnimals = () => {
    let index = 0;
    
    const introduceNext = () => {
      if (index < animals.length) {
        const animal = animals[index];
        setHighlightedAnimal(animal.id);
        
        playSpeech(animal.name, 0.9, () => {
          // Move to next animal after a short pause
          setTimeout(() => {
            setHighlightedAnimal(null);
            index++;
            setTimeout(introduceNext, 300);
          }, 800);
        });
      } else {
        // All animals introduced, start the timer
        setHighlightedAnimal(null);
        startTimer();
      }
    };
    
    introduceNext();
  };
  
  // Start the timer after introductions
  const startTimer = () => {
    if (timeLimit > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };
  
  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);
  
  // Toggle animal selection
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
  
  // Play animal name sound
  const playAnimalSound = (e, animal) => {
    e.stopPropagation(); // Prevent toggling selection
    
    setIsPlaying(animal.id);
    playSpeech(animal.name, 0.8, () => setIsPlaying(null));
  };
  
  // Show hint
  const handleShowHint = () => {
    setShowHint(true);
    
    // Hide hint after 3 seconds
    setTimeout(() => {
      setShowHint(false);
    }, 3000);
  };
  
  // Submit answers
  const handleSubmit = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    onSubmit(selectedAnimals);
  };
  
  // Clear selection
  const handleClearSelection = () => {
    setSelectedAnimals([]);
  };
  
  return (
    <div className={styles.gameplayContainer}>
      <div className={styles.gameplayCard}>
        {/* Game Header */}
        <div className={styles.gameHeader}>
          <div className={styles.targetInfo}>
            <h2 className={styles.gameTitle}>
              <span className={styles.titleEmoji}>🔍</span>
              Sound Safari Hunt
            </h2>
            <p className={styles.gameSubtitle}>
              Find animals with the <span className={styles.targetSoundText}>"{targetSound}"</span> sound!
            </p>
          </div>
          
          <div className={styles.gameControls}>
            <div className={styles.selectionCount}>
              <span className={styles.countLabel}>Selected:</span>
              <span className={styles.countNumber}>{selectedAnimals.length}/{animals.length}</span>
            </div>
            
            <motion.button 
              className={styles.hintButton}
              onClick={handleShowHint}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className={styles.hintIcon}>💡</span>
              Hint
            </motion.button>
          </div>
        </div>
        
        {/* Character with Speech Bubble */}
        <div className={styles.characterContainer}>
          <motion.div 
            className={styles.character}
            animate={{ 
              y: [0, -8, 0],
              rotate: [0, 2, 0, -2, 0]
            }}
            transition={{ 
              y: { repeat: Infinity, duration: 3, ease: "easeInOut" },
              rotate: { repeat: Infinity, duration: 2, ease: "easeInOut" }
            }}
          >
            <img src={WildLitzFox} alt="WildLitz Fox" className={styles.characterImage} />
            
            {/* Speech bubble for intro or hints */}
            {(showIntro || showHint) && (
              <motion.div 
                className={styles.speechBubble}
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {showIntro 
                  ? getCharacterIntro() 
                  : `Look for animals with the "${targetSound}" sound ${getPositionText()} of their name!`
                }
              </motion.div>
            )}
          </motion.div>
        </div>
        
        {/* Game Content */}
        <div className={styles.gameContent}>
          {/* Left Column - Timer & Instructions */}
          <div className={styles.gameColumn}>
            <div className={styles.timerSection}>
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
                      backgroundColor: timeRemaining < 10 ? '#f44336' : '#4caf50'
                    }}
                    transition={{ duration: 0.5 }}
                  ></motion.div>
                </div>
              </div>
              
              <div className={styles.instructionsSection}>
                <div className={styles.instructionCard}>
                  <div className={styles.cardIcon}>🔊</div>
                  <div className={styles.cardContent}>
                    <h3>Listen Carefully</h3>
                    <p>Click on animal cards to hear their names pronounced.</p>
                  </div>
                </div>
                
                <div className={styles.instructionCard}>
                  <div className={styles.cardIcon}>👆</div>
                  <div className={styles.cardContent}>
                    <h3>Select Animals</h3>
                    <p>Choose all animals with the "{targetSound}" sound {getPositionText()}.</p>
                  </div>
                </div>
                
                <div className={styles.instructionCard}>
                  <div className={styles.cardIcon}>⏱️</div>
                  <div className={styles.cardContent}>
                    <h3>Beat the Clock</h3>
                    <p>Submit your answers before time runs out!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Animals Grid */}
          <div className={`${styles.gameColumn} ${styles.animalsColumn}`}>
            <div className={styles.animalsGrid}>
              {animals.map(animal => (
                <motion.div 
                  key={animal.id}
                  className={`${styles.animalCard} 
                    ${selectedAnimals.some(a => a.id === animal.id) ? styles.selected : ''} 
                    ${highlightedAnimal === animal.id ? styles.highlighted : ''}`}
                  onClick={() => handleToggleSelect(animal)}
                  whileHover={{ scale: 1.03, boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)" }}
                  whileTap={{ scale: 0.97 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    scale: highlightedAnimal === animal.id ? [1, 1.05, 1] : 1,
                    boxShadow: highlightedAnimal === animal.id ? "0 0 15px rgba(124, 77, 255, 0.8)" : "0 3px 6px rgba(0, 0, 0, 0.1)"
                  }}
                  transition={{ 
                    delay: Math.random() * 0.3,
                    scale: { repeat: highlightedAnimal === animal.id ? Infinity : 0, duration: 1 }
                  }}
                >
                  <div className={styles.animalImage}>
                    {animal.image}
                  </div>
                  <div className={styles.animalInfo}>
                    <div className={styles.animalName}>
                      {animal.name}
                      <motion.button 
                        className={styles.soundButton}
                        onClick={(e) => playAnimalSound(e, animal)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        disabled={isPlaying !== null}
                      >
                        {isPlaying === animal.id ? '🔊' : '🔊'}
                      </motion.button>
                    </div>
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
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleClearSelection}
                disabled={selectedAnimals.length === 0}
              >
                <span className={styles.buttonIcon}>🔄</span>
                Clear Selection
              </motion.button>
              <motion.button 
                className={styles.submitButton}
                whileHover={{ scale: 1.03, boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)" }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
              >
                <span className={styles.buttonIcon}>✅</span>
                Submit Answer
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameplayScreen;