// src/pages/games/vanishing/GameplayScreen.jsx - REDESIGNED FOR KIDS
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../../styles/games/vanishing/GameplayScreen.module.css';

/**
 * 🎨 COMPLETELY REDESIGNED GameplayScreen for Kids
 * Features: Colorful UI, Fun animations, Clear feedback, Kid-friendly interactions
 */
const GameplayScreen = ({ 
  wordData, 
  config, 
  onResult, 
  round, 
  totalRounds,
  gameStats,
  onStatsUpdate,
  classEnergy = 100,
  onEnergyUpdate,
  teamPlay = false,
  currentTeam = 'teamA',
  teamScores = { teamA: 0, teamB: 0 },
  teamNames = { teamA: 'Team A', teamB: 'Team B' }
}) => {
  const { word, pattern, patternPosition } = wordData;
  
  // Game states
  const [timeRemaining, setTimeRemaining] = useState(5);
  const [vanishState, setVanishState] = useState('visible');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [preVanishPhase, setPreVanishPhase] = useState('initial');
  const [showPhonicsHint, setShowPhonicsHint] = useState(false);
  
  // Enhanced vanishing effects
  const [vanishingStyle, setVanishingStyle] = useState('fade');
  const [vanishingLetters, setVanishingLetters] = useState([]);
  
  // Fun feedback states
  const [showStars, setShowStars] = useState(false);
  const [showEncouragement, setShowEncouragement] = useState(false);
  const [encouragementText, setEncouragementText] = useState('');
  
  // Audio refs
  const wordAudioRef = useRef(null);
  const successSoundRef = useRef(null);
  
  // Initialize vanishing style based on difficulty
  useEffect(() => {
    const styles = ['fade', 'blur', 'letterDrop', 'syllable'];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    setVanishingStyle(config.difficulty === 'hard' ? 'letterDrop' : randomStyle);
  }, [config.difficulty]);

  // Preview phase sequence
  // Preview phase sequence
useEffect(() => {
  if (preVanishPhase === 'initial') {
    const timer = setTimeout(() => {
      setPreVanishPhase('preview');
      playWordAudio();
    }, 500);
    return () => clearTimeout(timer);
  }
  
  if (preVanishPhase === 'preview') {
    const timer = setTimeout(() => {
      setPreVanishPhase('ready');
    }, 3000);
    return () => clearTimeout(timer);
  }
  
  if (preVanishPhase === 'ready') {
  const timer = setTimeout(() => {
    setPreVanishPhase('vanishing');
    // Word stays visible, then starts vanishing
    setTimeout(() => {
      startVanishing();
    }, 100); // Small delay to ensure word is visible first
  }, 1000);
  return () => clearTimeout(timer);
}
}, [preVanishPhase]);

  // Timer countdown
  useEffect(() => {
    if (preVanishPhase === 'vanishing' && vanishState === 'vanished' && !hasAnswered) {
      if (timeRemaining > 0) {
        const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [timeRemaining, preVanishPhase, vanishState, hasAnswered]);

  const playWordAudio = () => {
    if (wordAudioRef.current) {
      wordAudioRef.current.play().catch(() => {
        // Audio not available, silent fail
      });
    }
  };

  const startVanishing = () => {
  // Get vanish speed from config
  const speedMultipliers = {
    'slow': 3000,      // 3 seconds to vanish
    'normal': 1500,    // 1.5 seconds to vanish
    'fast': 800,       // 0.8 seconds to vanish
    'instant': 300     // 0.3 seconds to vanish
  };
  
  const vanishDuration = speedMultipliers[config.vanishSpeed] || 1500;
  
  // Start vanishing immediately
  setVanishState('vanishing');
  
  if (vanishingStyle === 'letterDrop') {
    // Vanish letters one by one
    const letters = word.split('').map((_, index) => index);
    const shuffled = [...letters].sort(() => Math.random() - 0.5);
    const letterDelay = vanishDuration / letters.length;
    
    shuffled.forEach((letterIndex, i) => {
      setTimeout(() => {
        setVanishingLetters(prev => [...prev, letterIndex]);
      }, i * letterDelay);
    });
    
    // Mark as fully vanished
    setTimeout(() => {
      setVanishState('vanished');
    }, vanishDuration + 200);
  } else {
    // For other styles (fade, blur, etc), just fade out gradually
    setTimeout(() => {
      setVanishState('vanished');
    }, vanishDuration);
  }
};

  const handleIKnowIt = () => {
  if (hasAnswered) return;
  setHasAnswered(true);
  
  // Show the word again!
  setVanishState('visible');
  setPreVanishPhase('preview');
  
  // Fun success feedback
  setShowStars(true);
  setEncouragementText('🌟 Amazing! You got it! 🌟');
  setShowEncouragement(true);
  
  if (successSoundRef.current) {
    successSoundRef.current.play().catch(() => {});
  }
  
  setTimeout(() => {
    onResult(true, word, 5 - timeRemaining);
  }, 1500);
};

  const handleShowWord = () => {
  if (hasAnswered) return;
  setHasAnswered(true);
  
  // Show the word again!
  setVanishState('visible');
  setPreVanishPhase('preview');
  
  setEncouragementText('👀 That\'s okay! Keep practicing!');
  setShowEncouragement(true);
  
  setTimeout(() => {
    onResult(false, word, 5 - timeRemaining);
  }, 1500);
};

  const handleGiveUp = () => {
  if (hasAnswered) return;
  setHasAnswered(true);
  
  // Show the word again!
  setVanishState('visible');
  setPreVanishPhase('preview');
  
  setEncouragementText('💪 Don\'t worry! You\'ll get the next one!');
  setShowEncouragement(true);
  
  setTimeout(() => {
    onResult('giveup', word, 5 - timeRemaining);
  }, 1500);
};

  const handleSkip = () => {
    if (hasAnswered) return;
    setHasAnswered(true);
    onResult('skip', word, 0);
  };

  // Render word with vanishing effect
  // Render word with vanishing effect
const renderWord = () => {
  const letters = word.split('');
  
  // During preview and ready - show word clearly
  if (preVanishPhase === 'preview' || preVanishPhase === 'ready') {
    return (
      <motion.div
        className={styles.wordDisplay}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.5 }}
      >
        {letters.map((letter, index) => {
          const isPattern = pattern && word.toLowerCase().indexOf(pattern.toLowerCase()) <= index && 
                           index < word.toLowerCase().indexOf(pattern.toLowerCase()) + pattern.length;
          
          return (
            <motion.span
              key={index}
              className={`${styles.letter} ${isPattern && config.highlightTarget ? styles.patternLetter : ''}`}
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1, type: 'spring', bounce: 0.6 }}
            >
              {letter}
            </motion.span>
          );
        })}
      </motion.div>
    );
  }
  
  // During vanishing phase - gradually disappear
  // During vanishing phase - gradually disappear
if (preVanishPhase === 'vanishing') {
  // Calculate opacity based on vanish state and speed
  const getOpacityStyle = () => {
    // Word is fully gone
    if (vanishState === 'vanished') {
      return { opacity: 0 };
    }
    // Word is currently vanishing
    if (vanishState === 'vanishing') {
      const durations = {
        'slow': '3s',
        'normal': '1.5s', 
        'fast': '0.8s',
        'instant': '0.3s'
      };
      return {
        opacity: 0,
        transition: `opacity ${durations[config.vanishSpeed] || '1.5s'} ease-out`
      };
    }
    // Word is still visible (before vanishing starts)
    return { opacity: 1 };
  };

  return (
    <div className={styles.wordDisplay}>
      {vanishingStyle === 'letterDrop' ? (
        // Letter drop animation
        letters.map((letter, index) => {
          const isVanished = vanishingLetters.includes(index);
          return (
            <motion.span
              key={index}
              className={styles.letter}
              animate={{
                opacity: isVanished ? 0 : 1,
                y: isVanished ? 50 : 0,
                rotate: isVanished ? 180 : 0,
              }}
              transition={{ duration: 0.5 }}
            >
              {letter}
            </motion.span>
          );
        })
      ) : (
        // Fade/blur animation for entire word - GHOST EFFECT!
        <div style={getOpacityStyle()}>
          {letters.map((letter, index) => {
            const isPattern = pattern && word.toLowerCase().indexOf(pattern.toLowerCase()) <= index && 
                             index < word.toLowerCase().indexOf(pattern.toLowerCase()) + pattern.length;
            return (
              <span 
                key={index} 
                className={`${styles.letter} ${isPattern && config.highlightTarget ? styles.patternLetter : ''}`}
              >
                {letter}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
  
  // Fallback - show word (when button clicked)
  return (
    <div className={styles.wordDisplay}>
      {letters.map((letter, index) => (
        <span key={index} className={styles.letter}>
          {letter}
        </span>
      ))}
    </div>
  );
};

  return (
    <div className={styles.gameplayContainer}>

      {/* 📊 Top Game Info Bar */}
      <div className={styles.gameInfoBar}>
        <motion.div 
          className={styles.roundIndicator}
          whileHover={{ scale: 1.05 }}
        >
          <span className={styles.roundEmoji}>🎯</span>
          <span className={styles.roundText}>Round {round}/{totalRounds}</span>
        </motion.div>
        
        <motion.div 
          className={styles.scoreIndicator}
          whileHover={{ scale: 1.05 }}
        >
          <span className={styles.scoreEmoji}>⭐</span>
          <span className={styles.scoreText}>Score: {gameStats?.wordsRecognized || 0}</span>
        </motion.div>
        
        {teamPlay && (
          <div className={styles.teamIndicator}>
            <span className={styles.teamEmoji}>👥</span>
            <span className={styles.teamText}>
              {teamNames[currentTeam]}: {teamScores[currentTeam]}
            </span>
          </div>
        )}
      </div>

      {/* 🎮 Main Game Area */}
      <div className={styles.mainGameArea}>
        {/* Phase Indicators */}
        <AnimatePresence mode="wait">
          {preVanishPhase === 'preview' && (
            <motion.div
              className={styles.phaseMessage}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: 'spring', bounce: 0.5 }}
            >
              <span className={styles.messageEmoji}>👀</span>
              <span className={styles.messageText}>Look at this word!</span>
            </motion.div>
          )}
          
          {preVanishPhase === 'ready' && (
            <motion.div
              className={`${styles.phaseMessage} ${styles.readyMessage}`}
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: -180 }}
              transition={{ type: 'spring', bounce: 0.5 }}
            >
              <span className={styles.messageEmoji}>🚀</span>
              <span className={styles.messageText}>Get Ready!</span>
            </motion.div>
          )}
          
          {preVanishPhase === 'vanishing' && vanishState === 'vanished' && !hasAnswered && (
            <motion.div
              className={`${styles.phaseMessage} ${styles.thinkMessage}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
            >
              <span className={styles.messageEmoji}>🤔</span>
              <span className={styles.messageText}>Can you remember?</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Word Display Area */}
        <div className={styles.wordArea}>
          {renderWord()}
          
          {/* Timer Display */}
          {preVanishPhase === 'vanishing' && vanishState === 'vanished' && !hasAnswered && (
            <motion.div
              className={styles.timerDisplay}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.6 }}
            >
              <div className={styles.timerCircle}>
                <span className={styles.timerNumber}>{timeRemaining}</span>
              </div>
              <span className={styles.timerLabel}>seconds left!</span>
            </motion.div>
          )}
        </div>

        {/* Success Stars Animation */}
        <AnimatePresence>
          {showStars && (
            <>
              {[...Array(10)].map((_, i) => (
                <motion.div
                  key={i}
                  className={styles.successStar}
                  initial={{ 
                    scale: 0, 
                    x: 0, 
                    y: 0,
                    opacity: 1 
                  }}
                  animate={{ 
                    scale: [0, 1, 0.8, 0],
                    x: Math.random() * 400 - 200,
                    y: Math.random() * 400 - 200,
                    opacity: [1, 1, 0.5, 0]
                  }}
                  transition={{ 
                    duration: 1.5,
                    delay: i * 0.1 
                  }}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    fontSize: '2rem'
                  }}
                >
                  ⭐
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Encouragement Message */}
        <AnimatePresence>
          {showEncouragement && (
            <motion.div
              className={styles.encouragementBubble}
              initial={{ scale: 0, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0, y: -50 }}
              transition={{ type: 'spring', bounce: 0.6 }}
            >
              {encouragementText}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 🎮 Action Buttons */}
      <div className={styles.actionButtons}>
        <motion.button
          className={`${styles.actionButton} ${styles.iKnowItButton}`}
          onClick={handleIKnowIt}
          disabled={hasAnswered || preVanishPhase !== 'vanishing' || vanishState !== 'vanished'}
          whileHover={{ scale: 1.05, rotate: 2 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className={styles.buttonEmoji}>✅</span>
          <span className={styles.buttonText}>I Know It!</span>
        </motion.button>

        <motion.button
          className={`${styles.actionButton} ${styles.showMeButton}`}
          onClick={handleShowWord}
          disabled={hasAnswered || preVanishPhase !== 'vanishing' || vanishState !== 'vanished'}
          whileHover={{ scale: 1.05, rotate: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className={styles.buttonEmoji}>👀</span>
          <span className={styles.buttonText}>Show Me</span>
        </motion.button>

        <motion.button
          className={`${styles.actionButton} ${styles.giveUpButton}`}
          onClick={handleGiveUp}
          disabled={hasAnswered || preVanishPhase !== 'vanishing' || vanishState !== 'vanished'}
          whileHover={{ scale: 1.05, rotate: 2 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className={styles.buttonEmoji}>💭</span>
          <span className={styles.buttonText}>Give Up</span>
        </motion.button>

        <motion.button
          className={`${styles.actionButton} ${styles.skipButton}`}
          onClick={handleSkip}
          disabled={hasAnswered}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className={styles.buttonEmoji}>⏭️</span>
          <span className={styles.buttonText}>Skip</span>
        </motion.button>
      </div>

      {/* Hidden Audio Elements - Optional (remove if audio files not available) */}
      {/* <audio ref={wordAudioRef} src="/sounds/word-audio.mp3" />
      <audio ref={successSoundRef} src="/sounds/success.mp3" /> */}
    </div>
  );
};

export default GameplayScreen;