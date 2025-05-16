// src/pages/games/soundsafari/SoundSafariLoadingScreen.jsx <updated on 2025-04-25>
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from '../../../styles/games/safari/SoundSafariLoading.module.css';

/**
 * Loading screen component for Sound Safari game
 * Redesigned with horizontal layout and no overflow/scroll
 */
const SoundSafariLoadingScreen = ({ 
  targetSound, 
  difficulty = 'easy', 
  onContinue,
  round = 1,
  totalRounds = 5
}) => {
  const [progress, setProgress] = useState(0);
  const [factsIndex, setFactsIndex] = useState(0);
  
  // Random fun facts about sounds and animals
  const funFacts = [
    "Elephants communicate using sounds too low for humans to hear!",
    "Dolphins can recognize and respond to their own name!",
    "Bats use sound waves to 'see' in the dark - it's called echolocation!",
    "Whales can sing songs that travel for miles through the ocean!",
    "A lion's roar can be heard up to 5 miles away!",
    "Frogs have different calls to attract mates and warn of danger!",
    "Parrots can learn to mimic human speech and other sounds!",
    "Crickets make sound by rubbing their wings together!",
    "Some animals like giraffes are almost completely silent!",
    "Birds learn their songs just like humans learn to speak!"
  ];

  // Examples for each sound to display during loading
  const soundExamples = {
    's': "snake, sun, seal, spider", 
    'm': "monkey, mouse, map, moon",
    't': "tiger, turtle, table, tree",
    'b': "bear, ball, boat, bee",
    'p': "penguin, pig, pan, pear",
    'f': "fox, fish, frog, flower",
    'l': "lion, leaf, log, lamp",
    'z': "zebra, zoo, zigzag, zero"
  };

  // Get examples for this sound, or show generic message
  const examples = soundExamples[targetSound] || 
    'words containing this sound';
    
  // Format difficulty for display
  const formatDifficulty = (diff) => {
    return diff.charAt(0).toUpperCase() + diff.slice(1);
  };
  
  // Auto advance the progress bar
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prevProgress => {
        const newProgress = prevProgress + 1;
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          // Wait a moment at 100% before continuing
          setTimeout(() => {
            if (onContinue) onContinue();
          }, 500);
          return 100;
        }
        return newProgress;
      });
    }, 20); // 20ms * 100 steps = ~2 seconds
    
    // Clean up interval on unmount
    return () => {
      clearInterval(progressInterval);
    };
  }, [onContinue]);
  
  // Rotate through fun facts
  useEffect(() => {
    const factInterval = setInterval(() => {
      setFactsIndex(prev => (prev + 1) % funFacts.length);
    }, 4000);
    
    return () => clearInterval(factInterval);
  }, []);
  
  // Get difficulty icon
  const getDifficultyIcon = () => {
    switch(difficulty) {
      case 'easy': return '🟢';
      case 'medium': return '🟡';
      case 'hard': return '🔴';
      default: return '🟢';
    }
  };

  return (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingCard}>
        <div className={styles.loadingContent}>
          {/* Left Column - Target Sound */}
          <div className={styles.loadingColumn}>
            <div className={styles.targetSoundSection}>
              <h3>Target Sound:</h3>
              <motion.div 
                className={styles.targetSoundCircle}
                animate={{ 
                  boxShadow: ['0 0 0 rgba(129, 201, 192, 0.4)', '0 0 20px rgba(129, 201, 192, 0.8)', '0 0 0 rgba(129, 201, 192, 0.4)']
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className={styles.targetSoundDisplay}>{targetSound.toUpperCase()}</span>
              </motion.div>
              <p>Listen for this sound in animal names!</p>
              
              <div className={styles.examplesBox}>
                <h4>Examples:</h4>
                <p>{examples}</p>
              </div>
            </div>
          </div>
          
          {/* Center Column - Progress Bar & Info */}
          <div className={styles.loadingColumn}>
            <div className={styles.loadingHeader}>
              <motion.h2 
                className={styles.loadingTitle}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className={styles.headerEmoji}>🌍</span>
                Safari Adventure Loading
              </motion.h2>
              
              <div className={styles.roundInfo}>
                <div className={styles.roundText}>Round</div>
                <div className={styles.roundNumbers}>
                  <span className={styles.currentRound}>{round}</span>
                  <span className={styles.totalRounds}>/{totalRounds}</span>
                </div>
              </div>
            </div>
            
            <div className={styles.progressSection}>
              <div className={styles.progressBarContainer}>
                <motion.div 
                  className={styles.progressBar}
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
              <div className={styles.progressLabel}>
                {progress < 100 ? 'Preparing animals...' : 'Ready!'}
              </div>
            </div>
            
            <div className={styles.infoGrid}>
              <div className={styles.difficultyBadge}>
                <span className={styles.difficultyIcon}>{getDifficultyIcon()}</span>
                <span>Difficulty: {formatDifficulty(difficulty)}</span>
              </div>
              
              <motion.div 
                className={styles.funFactBox}
                key={factsIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className={styles.factTitle}>
                  <span className={styles.factEmoji}>🧠</span> Fun Fact:
                </div>
                <p>{funFacts[factsIndex]}</p>
              </motion.div>
            </div>
            
            <div className={styles.actionButtons}>
              <motion.button 
                className={styles.skipButton}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onContinue}
              >
                Skip
              </motion.button>
              <motion.button 
                className={styles.startButton}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onContinue}
                disabled={progress < 100}
              >
                Start Sound Hunt!
              </motion.button>
            </div>
          </div>
          
          {/* Right Column - Game Tips */}
          <div className={styles.loadingColumn}>
            <div className={styles.tipsSection}>
              <h3>Sound Safari Tips:</h3>
              
              <div className={styles.tipBox}>
                <div className={styles.tipIcon}>🎯</div>
                <p>Listen carefully for the target sound in animal names!</p>
              </div>
              
              <div className={styles.tipBox}>
                <div className={styles.tipIcon}>👂</div>
                <p>This round focuses on the <strong>"{targetSound}"</strong> sound. Click buttons to hear pronunciations.</p>
              </div>
              
              <div className={styles.tipBox}>
                <div className={styles.tipIcon}>⏱️</div>
                <p>You'll have {getDifficultyTime(difficulty)} seconds to find all matching animals.</p>
              </div>
              
              <div className={styles.soundExamplesWrapper}>
                <div className={styles.soundExamplesHeader}>
                  <span className={styles.soundExampleIcon}>🔊</span>
                  <h4>Sound "{targetSound}" appears in:</h4>
                </div>
                <div className={styles.soundExamplesList}>
                  {getExamplesList(targetSound).map((word, index) => (
                    <div key={index} className={styles.soundExample}>
                      {word}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get time limit based on difficulty
const getDifficultyTime = (difficulty) => {
  switch(difficulty) {
    case 'easy': return '60';
    case 'medium': return '45';
    case 'hard': return '30';
    default: return '60';
  }
};

// Helper function to get a list of examples for a sound
const getExamplesList = (sound) => {
  const examples = {
    's': ['snake', 'sun', 'seal', 'star', 'squid', 'sock'],
    'm': ['monkey', 'mouse', 'moon', 'map', 'milk', 'mango'],
    't': ['tiger', 'turtle', 'table', 'toy', 'toe', 'tree'],
    'b': ['bear', 'ball', 'boat', 'bee', 'book', 'banana'],
    'p': ['penguin', 'pig', 'pan', 'pizza', 'pen', 'puppy'],
    'f': ['fox', 'fish', 'frog', 'foot', 'fan', 'food'],
    'l': ['lion', 'leaf', 'lamp', 'leg', 'lemon', 'lip'],
    'z': ['zebra', 'zoo', 'zero', 'zip', 'zigzag', 'zone']
  };
  
  return examples[sound] || ['cat', 'dog', 'fish', 'bird', 'elephant', 'giraffe'];
};

export default SoundSafariLoadingScreen;