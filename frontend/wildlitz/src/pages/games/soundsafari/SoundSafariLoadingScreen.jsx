// src/pages/games/soundsafari/SoundSafariLoadingScreen.jsx <updated on 2025-11-03>
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../../styles/games/safari/SoundSafariLoading.module.css';
/**
 * Loading screen component for Sound Safari game
 * Redesigned with jungle safari theme to match config screen
 */
const SoundSafariLoadingScreen = ({ 
  targetSound, 
  difficulty = 'easy', 
  onContinue,
  round = 1,
  totalRounds = 5,
  volume,
  isMuted,
  showVolumeControl,
  onVolumeChange,
  onToggleMute,
  onToggleVolumeControl
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
  const examples = soundExamples[targetSound] || 'words containing this sound';
    
  // Format difficulty for display
  const formatDifficulty = (diff) => {
    return diff.charAt(0).toUpperCase() + diff.slice(1);
  };
  
  // Auto advance the progress bar and continue
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prevProgress => {
        const newProgress = prevProgress + 1;
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return newProgress;
      });
    }, 30); // 30ms * 100 steps = 3 seconds
    
    // Auto-continue after 3 seconds
    const autoTimer = setTimeout(() => {
      console.log('⭐️ Auto-continuing from loading screen...');
      onContinue();
    }, 3000);
    
    // Cleanup
    return () => {
      clearInterval(progressInterval);
      clearTimeout(autoTimer);
    };
  }, [onContinue]);
  
  // Rotate through fun facts every 4 seconds
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
    const examplesMap = {
      's': ['snake', 'sun', 'seal', 'star', 'squid', 'sock'],
      'm': ['monkey', 'mouse', 'moon', 'map', 'milk', 'mango'],
      't': ['tiger', 'turtle', 'table', 'toy', 'toe', 'tree'],
      'b': ['bear', 'ball', 'boat', 'bee', 'book', 'banana'],
      'p': ['penguin', 'pig', 'pan', 'pizza', 'pen', 'puppy'],
      'f': ['fox', 'fish', 'frog', 'foot', 'fan', 'food'],
      'l': ['lion', 'leaf', 'lamp', 'leg', 'lemon', 'lip'],
      'z': ['zebra', 'zoo', 'zero', 'zip', 'zigzag', 'zone']
    };
    
    return examplesMap[sound] || ['cat', 'dog', 'fish', 'bird', 'elephant', 'giraffe'];
  };

  return (
    <div className={styles.loadingContainer}>
      <motion.div 
        className={styles.soundControlWrapper}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
      >
        <motion.button
          className={styles.soundButton}
          onClick={onToggleVolumeControl}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {isMuted ? '🔇' : volume > 0.5 ? '🔊' : volume > 0 ? '🔉' : '🔈'}
        </motion.button>
        
        <AnimatePresence>
          {showVolumeControl && (
            <motion.div
              className={styles.volumeControlPanel}
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <div className={styles.volumeHeader}>
                <span className={styles.volumeTitle}>🎵 Background Music</span>
              </div>
              
              <div className={styles.volumeControls}>
                <div className={styles.volumeSliderContainer}>
                  <span className={styles.volumeIcon}>🔈</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={onVolumeChange}
                    className={styles.volumeSlider}
                  />
                  <span className={styles.volumeIcon}>🔊</span>
                </div>
                
                <div className={styles.volumePercentage}>
                  {Math.round(volume * 100)}%
                </div>
                
                <motion.button
                  className={`${styles.muteButton} ${isMuted ? styles.muted : ''}`}
                  onClick={onToggleMute}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isMuted ? '🔇 Unmute' : '🔇 Mute'}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      {/* Falling leaves animation */}
      <div className={styles.leavesBackground}>🍃</div>
      
      <div className={styles.loadingCard}>
        {/* Swinging vines decoration */}
        <motion.div 
          className={styles.vineLeft}
          animate={{ rotate: [-20, -30, -20] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          🌿
        </motion.div>
        <motion.div 
          className={styles.vineRight}
          animate={{ rotate: [20, 30, 20] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        >
          🌿
        </motion.div>
        
        <div className={styles.loadingContent}>
          {/* Left Column - Target Sound */}
          <div className={styles.loadingColumn}>
            <div className={styles.targetSoundSection}>
              <h3 className={styles.sectionTitle}>Target Sound:</h3>
              <motion.div 
                className={styles.targetSoundCircle}
                animate={{ 
                  boxShadow: [
                    '0 0 0 rgba(104, 159, 56, 0.4)', 
                    '0 0 30px rgba(104, 159, 56, 0.8)', 
                    '0 0 0 rgba(104, 159, 56, 0.4)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className={styles.targetSoundDisplay}>{targetSound.toUpperCase()}</span>
              </motion.div>
              <p className={styles.targetDescription}>Listen for this sound in animal names!</p>
              
              <div className={styles.examplesBox}>
                <h4 className={styles.examplesTitle}>Examples:</h4>
                <p className={styles.examplesText}>{examples}</p>
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
                <span className={styles.headerEmoji}>🌴</span>
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
                {progress < 100 ? 'Preparing animals...' : 'Ready! 🎉'}
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
                <p className={styles.funFactText}>{funFacts[factsIndex]}</p>
              </motion.div>
            </div>
          </div>
          
          {/* Right Column - Game Tips */}
          <div className={styles.loadingColumn}>
            <div className={styles.tipsSection}>
              <h3 className={styles.sectionTitle}>Sound Safari Tips:</h3>
              
              <div className={styles.tipBox}>
                <motion.div 
                  className={styles.tipIcon}
                  animate={{ rotate: [0, -15, 15, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🎯
                </motion.div>
                <p className={styles.tipText}>Listen carefully for the target sound in animal names!</p>
              </div>
              
              <div className={styles.tipBox}>
                <motion.div 
                  className={styles.tipIcon}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  👂
                </motion.div>
                <p className={styles.tipText}>This round focuses on the <strong>"{targetSound}"</strong> sound. Click buttons to hear pronunciations.</p>
              </div>
              
              <div className={styles.tipBox}>
                <motion.div 
                  className={styles.tipIcon}
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ⏱️
                </motion.div>
                <p className={styles.tipText}>You'll have {getDifficultyTime(difficulty)} seconds to find all matching animals.</p>
              </div>
              
              <div className={styles.soundExamplesWrapper}>
                <div className={styles.soundExamplesHeader}>
                  <motion.span 
                    className={styles.soundExampleIcon}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    📊
                  </motion.span>
                  <h4 className={styles.soundExamplesTitle}>Sound "{targetSound}" appears in:</h4>
                </div>
                <div className={styles.soundExamplesList}>
                  {getExamplesList(targetSound).map((word, index) => (
                    <motion.div 
                      key={index} 
                      className={styles.soundExample}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {word}
                    </motion.div>
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

export default SoundSafariLoadingScreen;