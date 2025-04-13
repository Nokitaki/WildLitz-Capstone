import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from '../../../styles/SoundSafariLoading.module.css';

/**
 * Loading screen component for Sound Safari game
 * Displayed between rounds to introduce the target sound and prepare the player
 */
const SoundSafariLoadingScreen = ({ 
  targetSound, 
  difficulty = 'Medium', 
  onContinue,
  round = 1,
  totalRounds = 5
}) => {
  const [autoProgress, setAutoProgress] = useState(true);
  const [progress, setProgress] = useState(0);
  const [factsIndex, setFactsIndex] = useState(0);
  
  // Random fun facts about sounds and animals
  const funFacts = [
    "Elephants can communicate using sounds too low for humans to hear!",
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
    'z': "zebra, zoo, zigzag, zero",
    'g': "goat, giraffe, gift, game",
    'w': "wolf, whale, water, web",
    'd': "dog, dolphin, desk, door",
    'c': "cat, cow, car, cake",
    'r': "rabbit, rat, rain, rose",
    'h': "horse, hat, hand, house"
  };

  // Get examples for this sound, or show generic message
  const examples = soundExamples[targetSound.toLowerCase()] || 
    'words containing this sound';
    
  // Format difficulty for display
  const formatDifficulty = (diff) => {
    return diff.charAt(0).toUpperCase() + diff.slice(1);
  };
  
  // Auto advance the progress bar
  useEffect(() => {
    let progressInterval;
    
    if (autoProgress) {
      progressInterval = setInterval(() => {
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
    }
    
    // Clean up interval on unmount
    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [autoProgress, onContinue]);
  
  // Rotate through fun facts
  useEffect(() => {
    const factInterval = setInterval(() => {
      setFactsIndex(prev => (prev + 1) % funFacts.length);
    }, 4000);
    
    return () => clearInterval(factInterval);
  }, []);
  
  // Handle skip button click
  const handleSkip = () => {
    if (onContinue) onContinue();
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <motion.h2 
          className={styles.cardTitle}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span role="img" aria-label="Loading" className={styles.headerEmoji}>🌍</span>
          Safari Adventure Loading
        </motion.h2>
        
        <div className={styles.roundProgress}>
          <div className={styles.roundText}>Round</div>
          <div className={styles.roundNumbers}>
            <span className={styles.currentRound}>{round}</span>
            <span className={styles.totalRounds}>/{totalRounds}</span>
          </div>
        </div>
      </div>
      
      <div className={styles.aiBadge}>
        <span role="img" aria-label="AI">🤖</span> AI Assisted Word Selection
      </div>
      
      <motion.div 
        className={styles.targetSoundContainer}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <h3>Your Target Sound:</h3>
        <motion.div 
          className={styles.targetSoundCircle}
          animate={{ 
            boxShadow: ['0 0 0 rgba(255, 214, 0, 0.4)', '0 0 20px rgba(255, 214, 0, 0.8)', '0 0 0 rgba(255, 214, 0, 0.4)']
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className={styles.targetSoundDisplay}>{targetSound.toUpperCase()}</span>
        </motion.div>
        <p>Listen for this sound in animal names!</p>
      </motion.div>
      
      <div className={styles.loadingProgressContainer}>
        <div className={styles.progressBarContainer}>
          <motion.div 
            className={styles.progressBar}
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          ></motion.div>
        </div>
        <div className={styles.progressLabel}>
          {progress < 100 ? 'Preparing animals...' : 'Ready!'}
        </div>
      </div>
      
      <motion.div 
        className={styles.infoBox}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h4>Examples:</h4>
        <p>{examples}</p>
      </motion.div>
      
      <motion.div 
        className={styles.difficultyBadge}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
      >
        <span role="img" aria-label="Difficulty" className={styles.difficultyIcon}>
          {difficulty === 'easy' ? '🟢' : difficulty === 'medium' ? '🟡' : '🔴'}
        </span>
        <span>Difficulty: {formatDifficulty(difficulty)}</span>
      </motion.div>
      
      <motion.div 
        className={styles.funFactBox}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className={styles.factTitle}>
          <span role="img" aria-label="Fun Fact">🧠</span> Fun Fact:
        </div>
        <motion.p
          key={factsIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {funFacts[factsIndex]}
        </motion.p>
      </motion.div>
      
      <div className={styles.actionButtons}>
        <motion.button 
          className={styles.skipButton}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSkip}
        >
          Skip
        </motion.button>
        <motion.button 
          className={styles.startButton}
          whileHover={{ scale: 1.05, boxShadow: "0 8px 16px rgba(0,0,0,0.2)" }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSkip}
          disabled={progress < 100}
        >
          Start Sound Hunt!
        </motion.button>
      </div>
    </div>
  );
};

export default SoundSafariLoadingScreen;