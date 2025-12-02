// src/pages/games/vanishing/GameplayScreen.jsx - REDESIGNED FOR KIDS
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../../styles/games/vanishing/GameplayScreen.module.css';
import vanishingAudioService from '../../../services/vanishingAudioService';

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
  const { word, pattern, patternPosition, targetLetter } = wordData;

  const TIMER_VALUES = {
  easy: 30,
  medium: 25,
  hard: 20
};

// Get initial time based on difficulty
const initialTime = TIMER_VALUES[config.difficulty] || 30;
  
  // Game states
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
const [roundStartTime, setRoundStartTime] = useState(Date.now());
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
  // Add this new state for "Show Me" peek functionality
const [isPeeking, setIsPeeking] = useState(false);
const peekTimeoutRef = useRef(null);
  // Audio refs
  const wordAudioRef = useRef(null);
  const successSoundRef = useRef(null);

/**
 * ULTIMATE COMPREHENSIVE pattern detection with smart category-aware fallback
 * Ensures appropriate patterns are ALWAYS highlighted!
 */
const isCharPartOfPattern = (charIndex, text, pattern) => {
  if (!pattern || !text || pattern.length === 0) return false;
  
  const lowerText = text.toLowerCase();
  
  // Clean the pattern - remove prefixes to get actual pattern
  const cleanPattern = pattern
    .replace(/^short_/, '')
    .replace(/^long_/, '')
    .replace(/^blend_/, '')
    .replace(/^digraph_/, '')
    .replace(/^vowel_team_/, '')
    .toLowerCase();
  
  // ============================================
  // SPECIAL HANDLING: Magic-e patterns (a_e, i_e, o_e, u_e, e_e)
  // ============================================
  if (cleanPattern.includes('_')) {
    const [vowel, e] = cleanPattern.split('_');
    
    // Look for: vowel + any consonant + 'e'
    // Example: "cake" has 'a' at index 1, 'k' at index 2, 'e' at index 3
    for (let i = 0; i < lowerText.length - 2; i++) {
      if (lowerText[i] === vowel && 
          lowerText[i + 2] === e && 
          lowerText[i + 1] !== ' ') {  // Make sure middle character isn't a space
        // Underline both the vowel AND the silent e
        if (charIndex === i || charIndex === i + 2) {
          return true;
        }
      }
    }
    return false;
  }
  
  // ============================================
  // REGULAR PATTERNS: Consecutive letters (blends, digraphs, vowel teams)
  // ============================================
  for (let i = 0; i < cleanPattern.length; i++) {
    const patternStartIndex = charIndex - i;
    if (patternStartIndex >= 0 && patternStartIndex + cleanPattern.length <= text.length) {
      const substring = lowerText.substring(patternStartIndex, patternStartIndex + cleanPattern.length);
      if (substring === cleanPattern) {
        return true;
      }
    }
  }
  
  return false;
};

const extractPatternLetters = (pattern) => {
  if (!pattern) return '';
  
  // Handle specific patterns
  if (pattern.includes('short_')) return pattern.replace('short_', '');
  if (pattern.includes('long_')) return pattern.replace('long_', '');
  if (pattern.includes('digraph_')) return pattern.replace('digraph_', '');
  if (pattern.includes('blend_')) return pattern.replace('blend_', '');
  
  // ✅ NEW: Handle generic category names by returning empty
  // This prevents trying to find literal "blends" or "digraphs" in the word
  if (pattern === 'blends' || pattern === 'digraphs' || pattern === 'short_vowels' || pattern === 'long_vowels') {
    console.warn(`⚠️ Generic pattern "${pattern}" detected - AI should return specific pattern like "blend_bl"`);
    return ''; // Don't highlight anything if pattern is too generic
  }
  
  // If no prefix, return as-is
  return pattern;
};
  
  // Initialize vanishing style based on difficulty
  useEffect(() => {
    const styles = ['fade', 'blur', 'letterDrop', 'syllable'];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    setVanishingStyle(config.difficulty === 'hard' ? 'letterDrop' : randomStyle);
  }, [config.difficulty]);

  // Preview phase sequence
  // Preview phase sequence
// Preview phase sequence with AUDIO
useEffect(() => {
  if (preVanishPhase === 'initial') {
    const timer = setTimeout(() => {
      setPreVanishPhase('preview');
      
      // 🔊 PLAY WORD AUDIO HERE
      if (config.enableAudio && word) {
        vanishingAudioService.speakWord(word, {
          voiceType: config.voiceType || 'happy'
        });
      }
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
      setTimeout(() => {
        startVanishing();
      }, 100);
    }, 1000);
    return () => clearTimeout(timer);
  }
}, [preVanishPhase, word, config]);

useEffect(() => {
  setTimeRemaining(initialTime);
  setHasAnswered(false);
  setRoundStartTime(Date.now());
}, [wordData, initialTime]);

  // Timer countdown
// Timer countdown - Auto give up when time runs out
useEffect(() => {
  if (preVanishPhase === 'vanishing' && vanishState === 'vanished' && !hasAnswered) {
    if (timeRemaining > 0) {
      const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // TIME'S UP! Auto give up
      handleTimeUp();
    }
  }
}, [timeRemaining, preVanishPhase, vanishState, hasAnswered]);

  // Cleanup peek timeout on unmount
useEffect(() => {
  return () => {
    if (peekTimeoutRef.current) {
      clearTimeout(peekTimeoutRef.current);
    }
  };
}, []);

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

// Handle time up (auto give up)
// Handle time up (auto give up)
const handleTimeUp = () => {
  if (hasAnswered) return;
  setHasAnswered(true);
  
  // Show the word again
  setVanishState('visible');
  setPreVanishPhase('preview');
  
  setEncouragementText('⏰ Time\'s up! Don\'t worry, you\'ll get the next one!');
  setShowEncouragement(true);

  if (config.enableAudio) {
    vanishingAudioService.playGiveUpSound();
  }
  
  // Calculate elapsed time
  const elapsedTime = Math.floor((Date.now() - roundStartTime) / 1000);
  
  setTimeout(() => {
    onResult('timeout', word, elapsedTime);  // ✅ CORRECT - says 'timeout'
  }, 1500);
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
  
  if (config.enableAudio) {
    vanishingAudioService.playSuccessSound();
  }
  
// Calculate elapsed time
const elapsedTime = Math.floor((Date.now() - roundStartTime) / 1000);

setTimeout(() => {
  onResult(true, word, elapsedTime);
}, 1500);
};

  const handleShowWord = () => {
  if (hasAnswered || isPeeking) return;
  
  // Show word temporarily for 5 seconds
  setIsPeeking(true);
  setVanishState('visible');
  setPreVanishPhase('preview');
  
  setEncouragementText('👀 Take a good look! 5 seconds...');
  setShowEncouragement(true);
  
  // Clear any existing timeout
  if (peekTimeoutRef.current) {
    clearTimeout(peekTimeoutRef.current);
  }
  
  // Hide word again after 5 seconds
  peekTimeoutRef.current = setTimeout(() => {
    setVanishState('vanished');
    setPreVanishPhase('vanishing');
    setIsPeeking(false);
    setShowEncouragement(false);
    setEncouragementText('');
  }, 5000);
};

  const handleGiveUp = () => {
  if (hasAnswered) return;
  setHasAnswered(true);
  
  // Show the word again!
  setVanishState('visible');
  setPreVanishPhase('preview');
  
  setEncouragementText('💪 Don\'t worry! You\'ll get the next one!');
  setShowEncouragement(true);

  if (config.enableAudio) {
    vanishingAudioService.playGiveUpSound();
  }
  
// Calculate elapsed time
const elapsedTime = Math.floor((Date.now() - roundStartTime) / 1000);

setTimeout(() => {
  onResult('giveup', word, elapsedTime);
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
  const text = word.trim();
  const words = text.split(' ');
  
  // Extract the actual pattern to search for
  const actualPattern = targetLetter || extractPatternLetters(pattern);
  
  // ===== PREVIEW & READY PHASE =====
  if (preVanishPhase === 'preview' || preVanishPhase === 'ready') {
    let globalCharIndex = 0;
    
    return (
      <motion.div
        className={styles.wordDisplay}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.5 }}
      >
        {words.map((singleWord, wordIndex) => (
          <span key={wordIndex} className={styles.wordWrapper}>
            {singleWord.split('').map((letter, letterIndex) => {
              const currentGlobalIndex = globalCharIndex;
              globalCharIndex++;
              
              const isPattern = config.highlightTarget && isCharPartOfPattern(currentGlobalIndex, text, actualPattern);
              
              return (
                <motion.span
                  key={`${wordIndex}-${letterIndex}`}
                  className={`${styles.letter} ${isPattern ? styles.patternLetter : ''}`}
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: currentGlobalIndex * 0.05, type: 'spring', bounce: 0.6 }}
                >
                  {letter}
                </motion.span>
              );
            })}
            {wordIndex < words.length - 1 && (() => {
              globalCharIndex++;
              return <span className={styles.letter}> </span>;
            })()}
          </span>
        ))}
      </motion.div>
    );
  }
  
  // ===== VANISHING PHASE =====
  if (preVanishPhase === 'vanishing') {
    let globalCharIndex = 0;
    
    const getOpacityStyle = () => {
      if (vanishState === 'vanished') return { opacity: 0 };
      if (vanishState === 'vanishing') {
        const durations = { 'slow': '3s', 'normal': '1.5s', 'fast': '0.8s', 'instant': '0.3s' };
        return { opacity: 0, transition: `opacity ${durations[config.vanishSpeed] || '1.5s'} ease-out` };
      }
      return { opacity: 1 };
    };

    return (
      <div className={styles.wordDisplay}>
        {vanishingStyle === 'letterDrop' ? (
          words.map((singleWord, wordIndex) => (
            <span key={wordIndex} className={styles.wordWrapper}>
              {singleWord.split('').map((letter, letterIndex) => {
                const currentGlobalIndex = globalCharIndex;
                const isVanished = vanishingLetters.includes(currentGlobalIndex);
                globalCharIndex++;
                
                return (
                  <motion.span
                    key={letterIndex}
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
              })}
              {wordIndex < words.length - 1 && (() => {
                globalCharIndex++;
                return <span className={styles.letter}> </span>;
              })()}
            </span>
          ))
        ) : (
          <div style={getOpacityStyle()}>
            {words.map((singleWord, wordIndex) => (
              <span key={wordIndex} className={styles.wordWrapper}>
                {singleWord.split('').map((letter, letterIndex) => {
                  const currentGlobalIndex = globalCharIndex;
                  const isPattern = config.highlightTarget && isCharPartOfPattern(currentGlobalIndex, text, actualPattern);
                  globalCharIndex++;
                  
                  return (
                    <span 
                      key={letterIndex} 
                      className={`${styles.letter} ${isPattern ? styles.patternLetter : ''}`}
                    >
                      {letter}
                    </span>
                  );
                })}
                {wordIndex < words.length - 1 && (() => {
                  globalCharIndex++;
                  return <span className={styles.letter}> </span>;
                })()}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  // ===== FALLBACK =====
  return (
    <div className={styles.wordDisplay}>
      {words.map((singleWord, wordIndex) => (
        <span key={wordIndex} className={styles.wordWrapper}>
          {singleWord.split('').map((letter, letterIndex) => (
            <span key={letterIndex} className={styles.letter}>
              {letter}
            </span>
          ))}
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
  {/* Show solo score OR team scoreboard */}
  {!teamPlay ? (
    <motion.div 
      className={styles.scoreIndicator}
      whileHover={{ scale: 1.05 }}
    >
      <span className={styles.scoreEmoji}>⭐</span>
      <span className={styles.scoreText}>Score: {gameStats?.wordsRecognized || 0}</span>
    </motion.div>
  ) : (
    <div className={styles.teamScoreBoard}>
      <motion.div 
        className={`${styles.teamScore} ${currentTeam === 'teamA' ? styles.activeTeam : ''}`}
        animate={{ scale: currentTeam === 'teamA' ? 1.05 : 1 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <div className={styles.teamHeader}>
          <span className={styles.teamIcon}>🔵</span>
          <span className={styles.teamName}>{teamNames.teamA}</span>
        </div>
        <div className={styles.teamPoints}>{teamScores.teamA}</div>
        {currentTeam === 'teamA' && (
          <motion.div 
            className={styles.turnIndicator}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ repeat: Infinity, duration: 1, repeatType: "reverse" }}
          >
            👉 YOUR TURN!
          </motion.div>
        )}
      </motion.div>
      
      <div className={styles.vsText}>VS</div>
      
      <motion.div 
        className={`${styles.teamScore} ${currentTeam === 'teamB' ? styles.activeTeam : ''}`}
        animate={{ scale: currentTeam === 'teamB' ? 1.05 : 1 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <div className={styles.teamHeader}>
          <span className={styles.teamIcon}>🔴</span>
          <span className={styles.teamName}>{teamNames.teamB}</span>
        </div>
        <div className={styles.teamPoints}>{teamScores.teamB}</div>
        {currentTeam === 'teamB' && (
          <motion.div 
            className={styles.turnIndicator}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ repeat: Infinity, duration: 1, repeatType: "reverse" }}
          >
            👉 YOUR TURN!
          </motion.div>
        )}
      </motion.div>
    </div>
  )}
</div>
{/* ⏰ PUT THE TIMER HERE - RIGHT AFTER THE CLOSING </div> ABOVE ⬇️⬇️⬇️ */}
<motion.div 
  className={`${styles.circularTimer} ${timeRemaining <= 10 ? styles.timerWarning : ''} ${timeRemaining <= 5 ? styles.timerUrgent : ''}`}
  animate={timeRemaining <= 5 ? { 
    scale: [1, 1.15, 1],
    rotate: [0, 5, -5, 0]
  } : {}}
  transition={{ 
    duration: 0.5, 
    repeat: timeRemaining <= 5 ? Infinity : 0 
  }}
>
  <svg className={styles.timerRing} viewBox="0 0 100 100">
    <circle 
      className={styles.timerRingBg} 
      cx="50" 
      cy="50" 
      r="45" 
    />
    <circle 
      className={styles.timerRingProgress} 
      cx="50" 
      cy="50" 
      r="45"
      style={{
        strokeDashoffset: 283 - (283 * timeRemaining) / initialTime
      }}
    />
  </svg>
  <div className={styles.timerContent}>
    <span className={styles.timerNumber}>{timeRemaining}</span>
    <span className={styles.timerLabel}>sec</span>
  </div>
</motion.div>

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
          disabled={hasAnswered || isPeeking || preVanishPhase !== 'vanishing' || vanishState !== 'vanished'}
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