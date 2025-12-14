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
  challengeLevel,
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
  
  // Enhanced vanishing effects
  const [vanishingStyle, setVanishingStyle] = useState('fade');
  const [vanishingLetters, setVanishingLetters] = useState([]);
  
  // Fun feedback states
  const [showStars, setShowStars] = useState(false);
  const [showEncouragement, setShowEncouragement] = useState(false);
  const [encouragementText, setEncouragementText] = useState('');
  
  // New state for hint system
  const [revealedIndices, setRevealedIndices] = useState([]); // For single words/phrases
  const [revealedWordIndices, setRevealedWordIndices] = useState([]); // For sentences
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHintConfirm, setShowHintConfirm] = useState(false);

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
    for (let i = 0; i < lowerText.length - 2; i++) {
      if (lowerText[i] === vowel && 
          lowerText[i + 2] === e && 
          lowerText[i + 1] !== ' ') {
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
  
  if (pattern.includes('short_')) return pattern.replace('short_', '');
  if (pattern.includes('long_')) return pattern.replace('long_', '');
  if (pattern.includes('digraph_')) return pattern.replace('digraph_', '');
  if (pattern.includes('blend_')) return pattern.replace('blend_', '');
  
  if (pattern === 'blends' || pattern === 'digraphs' || pattern === 'short_vowels' || pattern === 'long_vowels') {
    console.warn(`⚠️ Generic pattern "${pattern}" detected - AI should return specific pattern like "blend_bl"`);
    return '';
  }
  
  return pattern;
};
  
  useEffect(() => {
    const styles = ['fade', 'blur', 'letterDrop', 'syllable'];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    setVanishingStyle(config.difficulty === 'hard' ? 'letterDrop' : randomStyle);
  }, [config.difficulty]);

useEffect(() => {
  if (preVanishPhase === 'initial') {
    const timer = setTimeout(() => {
      setPreVanishPhase('preview');
      
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
  setRevealedIndices([]);
  setRevealedWordIndices([]);
  setHintsUsed(0);
}, [wordData, initialTime]);

useEffect(() => {
  if (!showHintConfirm && preVanishPhase === 'vanishing' && vanishState === 'vanished' && !hasAnswered) {
    if (timeRemaining > 0) {
      const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      handleTimeUp();
    }
  }
}, [timeRemaining, preVanishPhase, vanishState, hasAnswered, showHintConfirm]);

  const startVanishing = () => {
  const speedMultipliers = {
    'slow': 3000,
    'normal': 1500,
    'fast': 800,
    'instant': 300
  };
  
  const vanishDuration = speedMultipliers[config.vanishSpeed] || 1500;
  
  setVanishState('vanishing');
  
  if (vanishingStyle === 'letterDrop') {
    const letters = word.split('').map((_, index) => index);
    const shuffled = [...letters].sort(() => Math.random() - 0.5);
    const letterDelay = vanishDuration / letters.length;
    
    shuffled.forEach((letterIndex, i) => {
      setTimeout(() => {
        setVanishingLetters(prev => [...prev, letterIndex]);
      }, i * letterDelay);
    });
    
    setTimeout(() => {
      setVanishState('vanished');
    }, vanishDuration + 200);
  } else {
    setTimeout(() => {
      setVanishState('vanished');
    }, vanishDuration);
  }
};

const handleTimeUp = () => {
  if (hasAnswered) return;
  setHasAnswered(true);
  
  setVanishState('visible');
  setPreVanishPhase('preview');
  
  setEncouragementText('⏰ Time\'s up! Don\'t worry, you\'ll get the next one!');
  setShowEncouragement(true);

  if (config.enableAudio) {
    vanishingAudioService.playGiveUpSound();
  }
  
  const elapsedTime = Math.floor((Date.now() - roundStartTime) / 1000);
  
  setTimeout(() => {
    onResult('timeout', word, elapsedTime);
  }, 1500);
};

  const handleIKnowIt = () => {
  if (hasAnswered) return;
  setHasAnswered(true);
  
  setVanishState('visible');
  setPreVanishPhase('preview');
  
  setShowStars(true);
  setEncouragementText('🌟 Amazing! You got it! 🌟');
  setShowEncouragement(true);
  
  if (config.enableAudio) {
    vanishingAudioService.playSuccessSound();
  }
  
  const elapsedTime = Math.floor((Date.now() - roundStartTime) / 1000);

  setTimeout(() => {
    onResult(true, word, elapsedTime);
  }, 1500);
};

  const requestHint = () => {
    if (hasAnswered || hintsUsed >= 2) return;
    setShowHintConfirm(true);
  };

  const confirmUseHint = () => {
    setShowHintConfirm(false);
    setTimeRemaining(prev => Math.max(0, prev - 3));

    if (challengeLevel === 'simple_sentences') {
        const words = word.split(' ');
        const allWordIndices = words.map((_, i) => i);
        const unrevealedWordIndices = allWordIndices.filter(i => !revealedWordIndices.includes(i));
        
        if (unrevealedWordIndices.length > 0) {
            const shuffled = [...unrevealedWordIndices].sort(() => 0.5 - Math.random());
            const indexToReveal = shuffled[0];
            setRevealedWordIndices(prev => [...prev, indexToReveal]);
        }
    } else {
        const allIndices = word.split('').map((_, i) => i);
        const unrevealedIndices = allIndices.filter(i => !revealedIndices.includes(i));
        let indicesToReveal = [];
        const shuffled = [...unrevealedIndices].sort(() => 0.5 - Math.random());

        if (hintsUsed === 0) {
          const revealCount = Math.max(1, Math.min(3, Math.floor(word.length / 3)));
          indicesToReveal = shuffled.slice(0, revealCount);
        } else if (hintsUsed === 1) {
          const additionalRevealCount = word.length < 8 ? 1 : 2;
          indicesToReveal = shuffled.slice(0, Math.min(additionalRevealCount, shuffled.length));
        }
        setRevealedIndices(prev => [...prev, ...indicesToReveal]);
    }

    setHintsUsed(prev => prev + 1);
  };

  const cancelUseHint = () => {
    setShowHintConfirm(false);
  };

  const handleGiveUp = () => {
  if (hasAnswered) return;
  setHasAnswered(true);
  
  setVanishState('visible');
  setPreVanishPhase('preview');
  
  setEncouragementText('💪 Don\'t worry! You\'ll get the next one!');
  setShowEncouragement(true);

  if (config.enableAudio) {
    vanishingAudioService.playGiveUpSound();
  }
  
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

const renderWord = () => {
  const text = word.trim();
  const words = text.split(' ');
  const actualPattern = targetLetter || extractPatternLetters(pattern);

  // ===== PREVIEW & READY PHASE =====
  if (preVanishPhase === 'preview' || preVanishPhase === 'ready') {
    let globalCharIndex = 0;
    return (
      <motion.div className={styles.wordDisplay} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
        {words.map((singleWord, wordIndex) => (
          <React.Fragment key={wordIndex}>
            <span className={styles.wordWrapper}>
              {singleWord.split('').map((letter, letterIndex) => {
                const currentGlobalIndex = globalCharIndex;
                globalCharIndex++;
                const isPattern = config.highlightTarget && isCharPartOfPattern(currentGlobalIndex, text, actualPattern);
                return (
                  <motion.span key={letterIndex} className={`${styles.letter} ${isPattern ? styles.patternLetter : ''}`} initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: currentGlobalIndex * 0.05, type: 'spring', bounce: 0.6 }}>
                    {letter}
                  </motion.span>
                );
              })}
            </span>
            {wordIndex < words.length - 1 && (() => {
              globalCharIndex++; // Account for space
              return ' ';
            })()}
          </React.Fragment>
        ))}
      </motion.div>
    );
  }
  
  // ===== VANISHING PHASE =====
  if (preVanishPhase === 'vanishing') {
    // --- HINT DISPLAY LOGIC ---
    if (vanishState === 'vanished' && (revealedIndices.length > 0 || revealedWordIndices.length > 0)) {
      let globalCharIndex = 0;
      return (
        <div className={styles.wordDisplay}>
          {words.map((singleWord, wordIndex) => (
            <React.Fragment key={wordIndex}>
              <span className={styles.wordWrapper}>
                {singleWord.split('').map((letter, letterIndex) => {
                  const currentGlobalIndex = globalCharIndex;
                  globalCharIndex++;
                  let isRevealed = challengeLevel === 'simple_sentences' ? revealedWordIndices.includes(wordIndex) : revealedIndices.includes(currentGlobalIndex);
                  const isPattern = isRevealed && config.highlightTarget && isCharPartOfPattern(currentGlobalIndex, text, actualPattern);
                  
                  return (
                    <motion.span
                      key={letterIndex}
                      className={`${styles.letter} ${isPattern ? styles.patternLetter : ''}`}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: isRevealed ? 1 : 0, scale: isRevealed ? 1 : 0.5 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    >
                      {letter}
                    </motion.span>
                  );
                })}
              </span>
              {wordIndex < words.length - 1 && (() => {
                globalCharIndex++; // Account for space
                return ' ';
              })()}
            </React.Fragment>
          ))}
        </div>
      );
    }
    
    // --- VANISHING ANIMATION LOGIC ---
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
             <React.Fragment key={wordIndex}>
              <span className={styles.wordWrapper}>
                {singleWord.split('').map((letter, letterIndex) => {
                  const currentGlobalIndex = globalCharIndex;
                  const isVanished = vanishingLetters.includes(currentGlobalIndex);
                  globalCharIndex++;
                  return (
                    <motion.span key={letterIndex} className={styles.letter} animate={{ opacity: isVanished ? 0 : 1, y: isVanished ? 50 : 0, rotate: isVanished ? 180 : 0, }} transition={{ duration: 0.5 }}>
                      {letter}
                    </motion.span>
                  );
                })}
              </span>
              {wordIndex < words.length - 1 && (() => {
                  globalCharIndex++;
                  return ' ';
              })()}
            </React.Fragment>
          ))
        ) : (
          <div style={getOpacityStyle()}>
            {words.map((singleWord, wordIndex) => (
              <React.Fragment key={wordIndex}>
                <span className={styles.wordWrapper}>
                  {singleWord.split('').map((letter, letterIndex) => {
                    const currentGlobalIndex = globalCharIndex;
                    globalCharIndex++;
                    const isPattern = config.highlightTarget && isCharPartOfPattern(currentGlobalIndex, text, actualPattern);
                    return (
                      <span key={letterIndex} className={`${styles.letter} ${isPattern ? styles.patternLetter : ''}`}>
                        {letter}
                      </span>
                    );
                  })}
                </span>
                {wordIndex < words.length - 1 && (() => {
                    globalCharIndex++;
                    return ' ';
                })()}
              </React.Fragment>
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
        <React.Fragment key={wordIndex}>
          <span className={styles.wordWrapper}>
            {singleWord.split('').map((letter, letterIndex) => (
              <span key={letterIndex} className={styles.letter}>
                {letter}
              </span>
            ))}
          </span>
          {wordIndex < words.length - 1 && ' '}
        </React.Fragment>
      ))}
    </div>
  );
};

  return (
    <div className={styles.gameplayContainer}>
      
      {showHintConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Use a Hint?</h2>
            <p>This will cost 3 seconds of your time. Are you sure?</p>
            <div className={styles.modalActions}>
              <button onClick={confirmUseHint} className={`${styles.actionButton} ${styles.iKnowItButton}`}>Yes, use hint</button>
              <button onClick={cancelUseHint} className={`${styles.actionButton} ${styles.giveUpButton}`}>No, cancel</button>
            </div>
          </div>
        </div>
      )}

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
          
          {preVanishPhase === 'vanishing' && vanishState === 'vanished' && !hasAnswered && !revealedIndices.length > 0 && (
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
          disabled={hasAnswered || preVanishPhase !== 'vanishing' || vanishState !== 'vanished'}
          whileHover={{ scale: 1.05, rotate: 2 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className={styles.buttonEmoji}>✅</span>
          <span className={styles.buttonText}>I Know It!</span>
        </motion.button>

        <motion.button
          className={`${styles.actionButton} ${styles.hintButton}`}
          onClick={requestHint}
          disabled={hasAnswered || preVanishPhase !== 'vanishing' || vanishState !== 'vanished' || hintsUsed >= 2}
          whileHover={{ scale: 1.05, rotate: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className={styles.buttonEmoji}>💡</span>
          <span className={styles.buttonText}>Hint ({2 - hintsUsed} left)</span>
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