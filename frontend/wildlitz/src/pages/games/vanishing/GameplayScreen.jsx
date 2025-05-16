// src/pages/games/vanishing/GameplayScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../../styles/games/vanishing/GameplayScreen.module.css';

/**
 * Enhanced GameplayScreen component for the Vanishing Game
 * Includes all gameplay improvements for classroom use
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
  // ADD THESE NEW PROPS:
  teamPlay = false,
  currentTeam = 'teamA',
  teamScores = { teamA: 0, teamB: 0 },
  teamNames = { teamA: 'Team A', teamB: 'Team B' }
}) => {
  // Destructure word data
  const { word, pattern, patternPosition } = wordData;
  
  // Basic game states
  const [timeRemaining, setTimeRemaining] = useState(5);
  const [vanishState, setVanishState] = useState('visible'); // visible, vanishing, vanished
  const [hasAnswered, setHasAnswered] = useState(false);
  
  // Enhanced preview phase states
  const [preVanishPhase, setPreVanishPhase] = useState('initial'); // 'initial', 'preview', 'ready', 'vanishing'
  const [showPhonicsHint, setShowPhonicsHint] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(false);
  
  // Enhanced vanishing effects
  const [vanishingStyle, setVanishingStyle] = useState('fade');
  const [vanishingLetters, setVanishingLetters] = useState([]);
  const [syllableVanishOrder, setSyllableVanishOrder] = useState([]);
  
  // Response phase states - simplified to prevent flickering
  const [responsePhase, setResponsePhase] = useState('none');
  const [phaseTimer, setPhaseTimer] = useState(0);
  const [showHandRaise, setShowHandRaise] = useState(false);
  const [participationCount, setParticipationCount] = useState(0);
  
  // Single timer reference for response phases

  
  // Participation energy system - use props
  const [energyLevel, setEnergyLevel] = useState(classEnergy || 100);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(gameStats?.streakCount || 0);
  const [celebrationTriggered, setCelebrationTriggered] = useState(false);


  const [showVisualFeedback, setShowVisualFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState(''); // 'correct' or 'incorrect'
  const [audioPlaying, setAudioPlaying] = useState(false);
  
  // Update energy when prop changes
  useEffect(() => {
    if (classEnergy !== undefined) {
      setEnergyLevel(classEnergy);
    }
  }, [classEnergy]);
  
  // Update streak when gameStats change
  useEffect(() => {
    if (gameStats?.streakCount !== undefined) {
      setConsecutiveCorrect(gameStats.streakCount);
    }
  }, [gameStats]);
  
  // Teacher controls
  const [teacherPaused, setTeacherPaused] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [showHint, setShowHint] = useState(false);
  const [discussionMode, setDiscussionMode] = useState(false);
  
  // Error handling and support
  const [attempts, setAttempts] = useState(0);
  const [needsSupport, setNeedsSupport] = useState(false);
  const [encouragementMessage, setEncouragementMessage] = useState('');
  
  // References - simplified
  const timerRef = useRef(null);
  const responseTimerRef = useRef(null);
  const phaseTimeoutRef = useRef(null);
  
  // Keyboard controls for teacher
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.code === 'Space') {
        event.preventDefault();
        handleTeacherPlayPause();
      } else if (event.key === 'r' || event.key === 'R') {
        handleInstantReveal();
      } else if (event.key === 'ArrowLeft') {
        adjustSpeed(-0.2);
      } else if (event.key === 'ArrowRight') {
        adjustSpeed(0.2);
      } else if (event.key === 's' || event.key === 'S') {
        handleSkip();
      } else if (event.key === 'd' || event.key === 'D') {
        toggleDiscussionMode();
      } else if (event.key === 'h' || event.key === 'H') {
        setShowHint(!showHint);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [vanishState, preVanishPhase, teacherPaused]);
  
  // Initialize game
  useEffect(() => {
    if (!wordData?.word) return;
    
    initializeGame();
  }, [wordData?.word, config]);
  
  // Initialize the game with all settings
  const initializeGame = () => {
    // Reset all states
    resetGameStates();
    
    // Determine vanishing style
    const style = selectVanishingStyle();
    setVanishingStyle(style);
    
    // Set initial display duration
    const duration = getVanishDuration();
    setTimeRemaining(duration / 1000);
    
    // Start enhanced preview sequence
    startEnhancedPreview();
    
    // Prepare special effects
    if (style === 'letterDrop') {
      prepareLetterDrop();
    } else if (style === 'syllable') {
      prepareSyllableVanish();
    }
  };
  
  // Cleanup function to clear all timers
  const clearAllTimers = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (responseTimerRef.current) {
      clearInterval(responseTimerRef.current);
      responseTimerRef.current = null;
    }
    if (phaseTimeoutRef.current) {
      clearTimeout(phaseTimeoutRef.current);
      phaseTimeoutRef.current = null;
    }
  };
  
  // Reset all game states
  const resetGameStates = () => {
    setPreVanishPhase('initial');
    setVanishState('visible');
    setHasAnswered(false);
    setShowPhonicsHint(false);
    setPlayingAudio(false);
    setResponsePhase('none');
    setPhaseTimer(0);
    setShowHandRaise(false);
    setTeacherPaused(false);
    setCelebrationTriggered(false);
    setShowHint(false);
    setDiscussionMode(false);
    setAttempts(0);
    setNeedsSupport(false);
    setEncouragementMessage('');
    
    // Clear all timers
    clearAllTimers();
  };
  
  // Select vanishing style based on content - AVOID BLUR
  const selectVanishingStyle = () => {
    const { challengeLevel } = config;
    
    if (challengeLevel === 'simple_sentences') {
      return 'gentle_fade'; // Changed from blur
    } else if (challengeLevel === 'phrases') {
      return 'syllable';
    } else if (challengeLevel === 'compound_words') {
      return 'word_split'; // Changed from puzzle
    } else {
      // Better animations for simple words
      const styles = ['gentle_fade', 'letter_by_letter', 'shrink_away'];
      return styles[Math.floor(Math.random() * styles.length)];
    }
  };
  
  // Enhanced preview sequence
  const startEnhancedPreview = () => {
  // Phase 1: Initial display
  setTimeout(() => {
    setPreVanishPhase('preview');
  }, 100);
  
  // Show phonics pattern highlight
  setTimeout(() => {
    setShowPhonicsHint(true);
  }, 500);
  
  // REPLACE THIS EXISTING SECTION:
  // Play audio if available
  setTimeout(() => {
    if (wordData.customAudio || wordData.usesCustomAudio) {
      setPlayingAudio(true);
      setTimeout(() => setPlayingAudio(false), 1500);
    }
  }, 800);
  
  // WITH THIS NEW SECTION:
  // Play audio if enabled
 setTimeout(() => {
  if (config.enableAudio && wordData.word) {
    console.log('Playing preview audio for:', wordData.word); // Debug log
    playWordAudio(wordData.word);
  }
}, 800);
  
  // Phase 2: Get ready cue
  setTimeout(() => {
    setPreVanishPhase('ready');
    setShowPhonicsHint(false);
  }, 2500);
  
  // Phase 3: Start vanishing
  setTimeout(() => {
    setPreVanishPhase('vanishing');
    if (!teacherPaused) {
      startVanishingSequence();
    }
  }, 3500);
};
  
  // Start the vanishing sequence
  const startVanishingSequence = () => {
    setVanishState('vanishing');
    
    if (vanishingStyle === 'letterDrop') {
      startLetterDropEffect();
    } else if (vanishingStyle === 'syllable') {
      startSyllableVanishEffect();
    } else {
      startDefaultVanishTimer();
    }
  };
  
  // Get vanish duration based on settings
  const getVanishDuration = () => {
    let baseDuration;
    
    switch(config.difficulty) {
      case 'easy': baseDuration = 5000; break;
      case 'medium': baseDuration = 4000; break;
      case 'hard': baseDuration = 3000; break;
      default: baseDuration = 4000;
    }
    
    // Adjust for content complexity
    if (config.challengeLevel === 'simple_sentences') {
      baseDuration += 2000;
    } else if (config.challengeLevel === 'phrases') {
      baseDuration += 1000;
    }
    
    // Apply teacher speed adjustment
    return baseDuration / speedMultiplier;
  };
  
  // Letter drop effect
  const prepareLetterDrop = () => {
    if (!wordData?.word) return;
    
    const letters = wordData.word.split('').map((letter, index) => ({
      letter,
      index,
      dropped: false,
      delay: Math.random() * 1000
    }));
    
    setVanishingLetters(letters);
  };
  
  const startLetterDropEffect = () => {
    const duration = getVanishDuration();
    
    vanishingLetters.forEach((letterObj) => {
      setTimeout(() => {
        setVanishingLetters(prev => 
          prev.map(l => 
            l.index === letterObj.index ? { ...l, dropped: true } : l
          )
        );
      }, letterObj.delay);
    });
    
    setTimeout(() => {
      onVanishComplete();
    }, duration);
  };
  
  // Syllable vanish effect
  const prepareSyllableVanish = () => {
    if (!wordData?.syllableBreakdown) return;
    
    const syllables = wordData.syllableBreakdown.split('-');
    const order = syllables.map((_, index) => index).sort(() => Math.random() - 0.5);
    setSyllableVanishOrder(order);
  };
  
  const startSyllableVanishEffect = () => {
    const duration = getVanishDuration();
    const syllableInterval = duration / syllableVanishOrder.length;
    
    syllableVanishOrder.forEach((syllableIndex, orderIndex) => {
      setTimeout(() => {
        const syllableElement = document.querySelector(`[data-syllable-index="${syllableIndex}"]`);
        if (syllableElement) {
          syllableElement.classList.add('syllable-vanished');
        }
      }, orderIndex * syllableInterval);
    });
    
    setTimeout(() => {
      onVanishComplete();
    }, duration);
  };
  
  // Default vanish timer
  const startDefaultVanishTimer = () => {
    const duration = getVanishDuration();
    const steps = 60;
    const stepDuration = duration / steps;
    
    let currentStep = 0;
    timerRef.current = setInterval(() => {
      if (teacherPaused) return;
      
      currentStep++;
      setTimeRemaining((duration - (currentStep * stepDuration)) / 1000);
      
      if (currentStep >= steps) {
        clearInterval(timerRef.current);
        onVanishComplete();
      }
    }, stepDuration);
  };
  
  // Handle vanish completion
  const onVanishComplete = () => {
    setVanishState('vanished');
    setTimeRemaining(0);
    startResponsePhase();
  };
  
  // Simplified response phase handling - no flickering
  const startResponsePhase = () => {
    // Immediate safety check
    if (hasAnswered) return;
    
    // Clear any existing response timers
    clearAllTimers();
    
    // Start with a delay after word fully vanishes
    phaseTimeoutRef.current = setTimeout(() => {
      if (!hasAnswered) {
        // Start thinking phase
        setResponsePhase('thinking');
        setPhaseTimer(5);
        
        responseTimerRef.current = setInterval(() => {
          setPhaseTimer(prev => {
            if (prev <= 1) {
              // Move to whisper phase
              setResponsePhase('whisper');
              setPhaseTimer(30);
              return 30;
            }
            if (prev === 26) {
              // After thinking ends, switch to whisper
              setResponsePhase('whisper');
              return prev - 1;
            }
            if (prev === 1 && responsePhase === 'whisper') {
              // After whisper ends, switch to response
              setResponsePhase('response');
              setShowHandRaise(true);
              setPhaseTimer(0);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }, 1500);
  };
  
  // Handle user responses - prevent multiple calls
 const handleUserResponse = (recognized) => {
  if (hasAnswered) return;
  
  setHasAnswered(true);
  clearAllTimers();
  setResponsePhase('none');
  setShowHandRaise(false);
  setPhaseTimer(0);
  setAttempts(prev => prev + 1);
  
  // Visual feedback
  setFeedbackType(recognized ? 'correct' : 'incorrect');
  setShowVisualFeedback(true);
  
  setTimeout(() => {
    setShowVisualFeedback(false);
  }, 1500);
    
  // Update participation and energy
  updateParticipationStats(recognized);
  
  // Show encouragement if struggling
  if (!recognized && attempts > 0) {
    setNeedsSupport(true);
    showEncouragement();
  }
  
  // Report result with delay for feedback
  setTimeout(() => {
    onResult(recognized, word);
  }, 1000);
};

// NEW FUNCTION - Handle showing the word (preview only)
const handleShowWord = () => {
  if (hasAnswered) return;
  
  // Show the word temporarily without marking as incorrect
  setVanishState('visible');
  setPreVanishPhase('revealed');
  
  // Set a timer to hide it again after 3 seconds
  setTimeout(() => {
    if (!hasAnswered) {
      setVanishState('vanished');
      setPreVanishPhase('vanishing');
    }
  }, 3000);
};
  
  // Update participation statistics
  const updateParticipationStats = (recognized) => {
    setParticipationCount(prev => prev + 1);
    
    if (recognized) {
      setConsecutiveCorrect(prev => prev + 1);
      const newEnergy = Math.min(100, energyLevel + 10);
      setEnergyLevel(newEnergy);
      
      // Update parent energy state
      if (onEnergyUpdate) {
        onEnergyUpdate(newEnergy);
      }
      
      // Trigger celebration for streaks
      if (consecutiveCorrect > 0 && (consecutiveCorrect + 1) % 3 === 0) {
        setCelebrationTriggered(true);
        setTimeout(() => setCelebrationTriggered(false), 2000);
      }
    } else {
      setConsecutiveCorrect(0);
      const newEnergy = Math.max(0, energyLevel - 5);
      setEnergyLevel(newEnergy);
      
      // Update parent energy state
      if (onEnergyUpdate) {
        onEnergyUpdate(newEnergy);
      }
    }
  };
  
  // Show encouragement message
  const showEncouragement = () => {
    const messages = [
      "That's okay! Let's try again!",
      "You're getting better at this!",
      "Keep trying! You can do it!",
      "No worries! Practice makes perfect!",
      "Good effort! Let's see it once more!"
    ];
    
    const message = messages[Math.floor(Math.random() * messages.length)];
    setEncouragementMessage(message);
    
    setTimeout(() => {
      setEncouragementMessage('');
      setNeedsSupport(false);
    }, 3000);
  };
  
  // Teacher control functions
  const handleTeacherPlayPause = () => {
    setTeacherPaused(!teacherPaused);
    
    if (!teacherPaused && preVanishPhase === 'vanishing' && vanishState === 'visible') {
      startVanishingSequence();
    }
  };
  
  const handleInstantReveal = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setVanishState('visible');
    setPreVanishPhase('vanishing');
    setTimeout(() => {
      handleUserResponse(false);
    }, 1500);
  };
  
  const adjustSpeed = (delta) => {
    setSpeedMultiplier(prev => Math.max(0.5, Math.min(2, prev + delta)));
  };
  
  const handleSkip = () => {
    if (hasAnswered) return;
    handleUserResponse(false);
  };
  
  const toggleDiscussionMode = () => {
    setDiscussionMode(!discussionMode);
    if (!discussionMode) {
      setTeacherPaused(true);
    }
  };
  
  // Get vanishing opacity for different effects
  const getVanishingOpacity = () => {
    if (vanishState === 'visible' || preVanishPhase !== 'vanishing') return 1;
    if (vanishState === 'vanished') return 0;
    
    const duration = getVanishDuration() / 1000;
    const progress = 1 - (timeRemaining / duration);
    
    switch(vanishingStyle) {
      case 'fade':
        return 1 - progress;
      case 'blur':
        return 1;
      case 'puzzle':
        return Math.max(0, 1 - (progress * 1.5));
      default:
        return 1 - progress;
    }
  };
  
  // Get blur amount for blur effect
  const getBlurAmount = () => {
    if (vanishingStyle !== 'blur' || vanishState !== 'vanishing') return 0;
    
    const duration = getVanishDuration() / 1000;
    const progress = 1 - (timeRemaining / duration);
    
    return progress * 20;
  };
  
  // Get transform for puzzle effect
  const getPuzzleTransform = () => {
    if (vanishingStyle !== 'puzzle' || vanishState !== 'vanishing') return 'none';
    
    const duration = getVanishDuration() / 1000;
    const progress = 1 - (timeRemaining / duration);
    
    const angle = progress * 45;
    const spread = progress * 100;
    
    return `rotate(${angle}deg) scale(${1 - progress * 0.5})`;
  };
  
  // Enhanced word rendering with new gentle effects
  const renderEnhancedWordWithHighlight = () => {
    switch(vanishingStyle) {
      case 'letterDrop':
      case 'letter_by_letter':
        return renderLetterByLetterWord();
      case 'syllable':
        return renderSyllableVanishWord();
      case 'puzzle':
      case 'word_split':
        return renderWordSplitEffect();
      case 'shrink_away':
        return renderShrinkAwayWord();
      case 'gentle_fade':
      default:
        return renderGentleFadeWord();
    }
  };
  
  // Gentle fade - much easier on eyes
  const renderGentleFadeWord = () => {
    const highlightedWord = renderBasicHighlighting();
    
    return (
      <motion.div
        animate={{
          opacity: getVanishingOpacity(),
          scale: vanishState === 'vanishing' ? 0.95 : 1
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {highlightedWord}
      </motion.div>
    );
  };
  
  // Shrink away effect
  const renderShrinkAwayWord = () => {
    const highlightedWord = renderBasicHighlighting();
    
    return (
      <motion.div
        animate={{
          scale: vanishState === 'vanishing' ? 0 : 1,
          opacity: getVanishingOpacity()
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {highlightedWord}
      </motion.div>
    );
  };
  
  // Letter by letter fade (gentle version of letterDrop)
  const renderLetterByLetterWord = () => {
    const word = wordData.word;
    const letters = word.split('');
    
    return (
      <span>
        {letters.map((letter, index) => (
          <motion.span
            key={index}
            animate={{
              opacity: vanishState === 'vanishing' 
                ? Math.max(0, 1 - (index / letters.length) * (1 - getVanishingOpacity()))
                : 1
            }}
            transition={{
              duration: 0.1,
              delay: vanishState === 'vanishing' ? index * 0.05 : 0
            }}
          >
            {letter}
          </motion.span>
        ))}
      </span>
    );
  };
  
  // Word split for compound words (gentler than puzzle)
  const renderWordSplitEffect = () => {
    const word = wordData.word;
    const midPoint = Math.floor(word.length / 2);
    const leftPart = word.substring(0, midPoint);
    const rightPart = word.substring(midPoint);
    
    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <motion.span
          animate={{
            x: vanishState === 'vanishing' ? -20 : 0,
            opacity: getVanishingOpacity()
          }}
          transition={{ duration: 0.3 }}
        >
          {leftPart}
        </motion.span>
        <motion.span
          animate={{
            x: vanishState === 'vanishing' ? 20 : 0,
            opacity: getVanishingOpacity()
          }}
          transition={{ duration: 0.3 }}
        >
          {rightPart}
        </motion.span>
      </div>
    );
  };
  
  // Basic highlighting without blur
  const renderBasicHighlighting = () => {
    const { word, pattern } = wordData;
    
    if (!config.highlightTarget || !pattern) {
      return <span>{word}</span>;
    }
    
    const getHighlightColor = (focus) => {
      switch(focus) {
        case 'short_vowels': return '#e53935';
        case 'long_vowels': return '#1976d2';
        case 'blends': return '#7b1fa2';
        case 'digraphs': return '#388e3c';
        default: return '#e53935';
      }
    };
    
    const highlightColor = getHighlightColor(config.learningFocus);
    
    // Handle sentences/phrases
    if (config.challengeLevel === 'simple_sentences' || config.challengeLevel === 'phrases') {
      const regex = new RegExp(`(${pattern})`, 'gi');
      const parts = word.split(regex);
      
      return (
        <span>
          {parts.map((part, index) => 
            regex.test(part) ? (
              <span 
                key={index} 
                style={{ 
                  color: highlightColor,
                  background: `${highlightColor}20`,
                  padding: '2px 4px',
                  borderRadius: '4px'
                }}
              >
                {part}
              </span>
            ) : (
              <span key={index}>{part}</span>
            )
          )}
        </span>
      );
    }
    
    // Single word highlighting
    const patternIndex = word.toLowerCase().indexOf(pattern.toLowerCase());
    
    if (patternIndex === -1) {
      return <span>{word}</span>;
    }
    
    const beforePattern = word.substring(0, patternIndex);
    const patternText = word.substring(patternIndex, patternIndex + pattern.length);
    const afterPattern = word.substring(patternIndex + pattern.length);
    
    return (
      <>
        <span>{beforePattern}</span>
        <span 
          style={{ 
            color: highlightColor,
            background: `${highlightColor}20`,
            padding: '2px 4px',
            borderRadius: '4px'
          }}
        >
          {patternText}
        </span>
        <span>{afterPattern}</span>
      </>
    );
  };
  
  // Render letter drop effect
  const renderLetterDropWord = () => {
    if (vanishingLetters.length === 0) {
      return <span>{wordData.word}</span>;
    }
    
    return (
      <span>
        {vanishingLetters.map((letterObj, index) => (
          <motion.span
            key={index}
            className={`${styles.letterDrop} ${letterObj.dropped ? styles.dropped : ''}`}
            animate={{
              y: letterObj.dropped ? 50 : 0,
              opacity: letterObj.dropped ? 0 : 1,
              rotate: letterObj.dropped ? Math.random() * 360 : 0
            }}
            transition={{
              duration: 0.8,
              ease: "easeIn"
            }}
          >
            {letterObj.letter}
          </motion.span>
        ))}
      </span>
    );
  };
  
  // Render syllable vanish effect
  const renderSyllableVanishWord = () => {
    if (!wordData.syllableBreakdown || !wordData.syllableBreakdown.includes('-')) {
      return renderDefaultWord();
    }
    
    const syllables = wordData.syllableBreakdown.split('-');
    
    return (
      <span>
        {syllables.map((syllable, index) => (
          <motion.span
            key={index}
            data-syllable-index={index}
            className={styles.syllableVanish}
            transition={{ duration: 0.5 }}
          >
            {syllable}
            {index < syllables.length - 1 && <span className={styles.hyphen}>-</span>}
          </motion.span>
        ))}
      </span>
    );
  };
  
  // Render puzzle effect
  const renderPuzzleWord = () => {
    const word = wordData.word;
    const midPoint = Math.floor(word.length / 2);
    const leftPart = word.substring(0, midPoint);
    const rightPart = word.substring(midPoint);
    
    return (
      <div className={styles.puzzleContainer}>
        <motion.span
          className={styles.puzzlePiece}
          animate={{
            x: vanishState === 'vanishing' ? -30 : 0,
            rotate: vanishState === 'vanishing' ? -15 : 0,
            opacity: getVanishingOpacity()
          }}
          transition={{ duration: 0.1 }}
        >
          {leftPart}
        </motion.span>
        <motion.span
          className={styles.puzzlePiece}
          animate={{
            x: vanishState === 'vanishing' ? 30 : 0,
            rotate: vanishState === 'vanishing' ? 15 : 0,
            opacity: getVanishingOpacity()
          }}
          transition={{ duration: 0.1 }}
        >
          {rightPart}
        </motion.span>
      </div>
    );
  };
  
  // Default word rendering
  const renderDefaultWord = () => {
    const { word, pattern } = wordData;
    
    if (!config.highlightTarget || !pattern) {
      return <span>{word}</span>;
    }
    
    // Get highlight color based on learning focus
    const getHighlightColor = (focus) => {
      switch(focus) {
        case 'short_vowels': return '#e53935';
        case 'long_vowels': return '#1976d2';
        case 'blends': return '#7b1fa2';
        case 'digraphs': return '#388e3c';
        default: return '#e53935';
      }
    };
    
    const highlightColor = getHighlightColor(config.learningFocus);
    
    // Handle different text types
    if (config.challengeLevel === 'simple_sentences' || config.challengeLevel === 'phrases') {
      const regex = new RegExp(`(${pattern})`, 'gi');
      const parts = word.split(regex);
      
      return (
        <motion.div
          style={{
            filter: `blur(${getBlurAmount()}px)`,
            transform: getPuzzleTransform()
          }}
          transition={{ duration: 0.1 }}
        >
          {parts.map((part, index) => 
            regex.test(part) ? (
              <span 
                key={index} 
                className={styles.highlightedPattern}
                style={{ 
                  color: highlightColor,
                  background: `${highlightColor}20`,
                  padding: '2px 4px',
                  borderRadius: '4px'
                }}
              >
                {part}
              </span>
            ) : (
              <span key={index}>{part}</span>
            )
          )}
        </motion.div>
      );
    }
    
    // Single word highlighting
    const patternIndex = word.toLowerCase().indexOf(pattern.toLowerCase());
    
    if (patternIndex === -1) {
      return (
        <motion.div
          style={{
            filter: `blur(${getBlurAmount()}px)`,
            transform: getPuzzleTransform()
          }}
          transition={{ duration: 0.1 }}
        >
          {word}
        </motion.div>
      );
    }
    
    const beforePattern = word.substring(0, patternIndex);
    const patternText = word.substring(patternIndex, patternIndex + pattern.length);
    const afterPattern = word.substring(patternIndex + pattern.length);
    
    return (
      <motion.div
        style={{
          filter: `blur(${getBlurAmount()}px)`,
          transform: getPuzzleTransform()
        }}
        transition={{ duration: 0.1 }}
      >
        <span>{beforePattern}</span>
        <span 
          className={styles.highlightedPattern}
          style={{ 
            color: highlightColor,
            background: `${highlightColor}20`,
            padding: '2px 4px',
            borderRadius: '4px'
          }}
        >
          {patternText}
        </span>
        <span>{afterPattern}</span>
      </motion.div>
    );
  };
  
  // Get pattern name for display
  const getPatternName = (pattern) => {
    const patternNames = {
      'a': 'Short A', 'e': 'Short E', 'i': 'Short I', 'o': 'Short O', 'u': 'Short U',
      'ai': 'Long A (ai)', 'ea': 'Long E (ea)', 'ight': 'Long I (ight)',
      'oa': 'Long O (oa)', 'ue': 'Long U (ue)',
      'bl': 'BL Blend', 'cr': 'CR Blend', 'st': 'ST Blend',
      'ch': 'CH Digraph', 'sh': 'SH Digraph', 'th': 'TH Digraph'
    };
    
    return patternNames[pattern?.toLowerCase()] || pattern?.toUpperCase() || '';
  };
  
  // Get display names
  const getChallengeLevelName = () => {
    const names = {
      simple_words: 'Simple Words',
      compound_words: 'Compound Words',
      phrases: 'Phrases', 
      simple_sentences: 'Simple Sentences'
    };
    return names[config.challengeLevel] || config.challengeLevel;
  };
  
  const getLearningFocusName = () => {
    const names = {
      short_vowels: 'Short Vowels',
      long_vowels: 'Long Vowels',
      blends: 'Blends',
      digraphs: 'Digraphs'
    };
    return names[config.learningFocus] || config.learningFocus;
  };





  const playWordAudio = async (text) => {
  if (!text || !config.enableAudio) return;
  
  const textToRead = wordData.word || text;
  console.log('Playing audio for:', textToRead);
  console.log('Voice config:', config.voiceType); // Debug voice config
  
  setAudioPlaying(true);
  setPlayingAudio(true);
  
  try {
    console.log('Calling TTS API...'); // Debug log
    const response = await fetch('/api/phonics/text-to-speech/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: textToRead,
        voice: config.voiceType || 'happy'
      })
    });
    
    console.log('API response status:', response.status); // Debug log
    
    if (response.ok) {
      const data = await response.json();
      console.log('API response data:', data); // Debug log
      
      if (data.success && data.audio_data) {
        console.log('Playing OpenAI audio with voice:', data.voice_used); // Debug log
        const audio = new Audio(`data:audio/mp3;base64,${data.audio_data}`);
        audio.onended = () => {
          setAudioPlaying(false);
          setPlayingAudio(false);
        };
        audio.onerror = (e) => {
          console.error('Audio playback error:', e);
          useBrowserTTS(textToRead);
        };
        await audio.play();
        return;
      } else {
        console.log('API success false or no audio data, falling back to browser TTS');
      }
    } else {
      console.log('API response not ok, status:', response.status);
    }
    
    // If API fails, use browser TTS
    useBrowserTTS(textToRead);
    
  } catch (error) {
    console.error('TTS API error:', error);
    useBrowserTTS(textToRead);
  }
};

// Add helper function for browser TTS
const useBrowserTTS = (text) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    
    // Get available voices
    const voices = window.speechSynthesis.getVoices();
    console.log('Available browser voices:', voices.map(v => v.name)); // Debug log
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Try to select a better voice based on config
    let preferredVoice = null;
    
    // Voice preferences based on config
    const voicePreferences = {
      'happy': ['Google US English Female', 'Microsoft Zira', 'Alex'],
      'gentle': ['Google UK English Female', 'Microsoft Hazel', 'Victoria'],
      'playful': ['Google US English Male', 'Microsoft David', 'Daniel'],
      'friendly': ['Google UK English Male', 'Microsoft Mark', 'Tom']
    };
    
    const currentVoiceType = config.voiceType || 'happy';
    const preferredNames = voicePreferences[currentVoiceType] || voicePreferences['happy'];
    
    // Try to find one of the preferred voices
    for (const prefName of preferredNames) {
      preferredVoice = voices.find(voice => voice.name.includes(prefName));
      if (preferredVoice) break;
    }
    
    // Fallback to first English voice
    if (!preferredVoice) {
      preferredVoice = voices.find(voice => voice.lang.startsWith('en'));
    }
    
    if (preferredVoice) {
      console.log('Using browser voice:', preferredVoice.name); // Debug log
      utterance.voice = preferredVoice;
    }
    
    utterance.rate = 0.8;
    utterance.volume = 1.0;
    utterance.pitch = 1.0;
    
    utterance.onend = () => {
      setAudioPlaying(false);
      setPlayingAudio(false);
    };
    utterance.onerror = (e) => {
      console.error('Speech synthesis error:', e);
      setAudioPlaying(false);
      setPlayingAudio(false);
    };
    
    window.speechSynthesis.speak(utterance);
  } else {
    console.error('Speech synthesis not supported');
    setAudioPlaying(false);
    setPlayingAudio(false);
  }
};



  
  return (
    <div className={styles.gameplayContainer}>
      <div className={styles.gameplayCard}>
        {/* Teacher Controls Bar */}
        <div className={styles.teacherControlBar}>
          <div className={styles.teacherControls}>
  <button 
    className={styles.teacherButton}
    onClick={handleTeacherPlayPause}
    title="Spacebar: Play/Pause"
  >
    {teacherPaused ? '▶️' : '⏸️'}
  </button>
  <button 
    className={styles.teacherButton}
    onClick={handleInstantReveal}
    title="R: Instant Reveal"
  >
    👁️
  </button>
  <button 
    className={styles.teacherButton}
    onClick={() => setShowHint(!showHint)}
    title="H: Toggle Hint"
  >
    💡
  </button>
  <button 
    className={styles.teacherButton}
    onClick={toggleDiscussionMode}
    title="D: Discussion Mode"
  >
    💬
  </button>
  
  {/* ADD AUDIO BUTTON HERE */}
  {config.enableAudio && (
  <button 
    className={styles.teacherButton}
    onClick={() => playWordAudio(wordData.word)}
    disabled={audioPlaying || !wordData.word}
    title="Audio: Play Word"
  >
    {audioPlaying ? '🔊' : '🔈'}
  </button>
)}
  
  <div className={styles.speedControl}>
    <button onClick={() => adjustSpeed(-0.2)}>⬇️</button>
    <span>{speedMultiplier.toFixed(1)}x</span>
    <button onClick={() => adjustSpeed(0.2)}>⬆️</button>
  </div>
</div>
          
          {/* Participation Energy Meter */}
          <div className={styles.energyMeter}>
            <div className={styles.energyLabel}>Class Energy</div>
            <div className={styles.energyBar}>
              <motion.div 
                className={styles.energyFill}
                animate={{ width: `${energyLevel}%` }}
                style={{
                  backgroundColor: energyLevel > 70 ? '#4caf50' : 
                                   energyLevel > 40 ? '#ff9800' : '#f44336'
                }}
              />
            </div>
            <div className={styles.energyStats}>
              <span>Streak: {gameStats?.streakCount || consecutiveCorrect}</span>
              <span>Participation: {gameStats?.wordsAttempted || participationCount}</span>
            </div>
          </div>
        </div>
        
        {/* Game Header */}
        <div className={styles.gameHeader}>
          <div className={styles.gameInfo}>
            <h2 className={styles.gameTitle}>
              {getChallengeLevelName()} - {getLearningFocusName()}
            </h2>
            <p className={styles.vanishingWarning}>
              Quick! Read before it vanishes!
            </p>
          </div>
        </div>
        
        {/* Vanishing Timer Bar */}
        <div className={styles.timerBarContainer}>
          <motion.div 
            className={styles.timerBar}
            initial={{ width: '100%' }}
            animate={{ 
              width: preVanishPhase === 'vanishing' ? `${(timeRemaining / (getVanishDuration() / 1000)) * 100}%` : '100%',
              backgroundColor: timeRemaining < 2 ? '#f44336' : '#ff9800'
            }}
            transition={{ duration: 0.1 }}
          />
        </div>
        
        {/* Word Display Area */}
        <div className={styles.wordDisplayArea}>

         
          
          {/* Visual Feedback Overlay */}
          <AnimatePresence>
            {showVisualFeedback && (
              <motion.div
                className={styles.visualFeedbackOverlay}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className={`${styles.feedbackIcon} ${styles[feedbackType]}`}
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: feedbackType === 'correct' ? [0, 15, -15, 0] : 0
                  }}
                  transition={{ duration: 0.6 }}
                >
                    {feedbackType === 'revealed' ? (
                    <div className={styles.revealedFeedback}>
                      <span className={styles.eyeMark}>👁️</span>
                      <span className={styles.feedbackText}>Word revealed!</span>
                    </div>
                  ) : feedbackType === 'correct' ? (
                    <div className={styles.successFeedback}>
                      <span className={styles.checkMark}>✅</span>
                      <span className={styles.feedbackText}>Correct!</span>
                    </div>
                  ) : (
                    <div className={styles.errorFeedback}>
                      <span className={styles.xMark}>❌</span>
                      <span className={styles.feedbackText}>Try again!</span>
                    </div>
                  )}
                </motion.div>
                
                {/* Flash effect */}
                <motion.div
                  className={`${styles.flashEffect} ${styles[feedbackType]}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.3, 0] }}
                  transition={{ duration: 0.5 }}
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Current Team Indicator for Team Play */}
          {teamPlay && (
            <motion.div 
              className={styles.currentTeamIndicator}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className={styles.teamTurnLabel}>Current Turn:</span>
              <span className={styles.currentTeamName}>
                {currentTeam === 'teamA' ? teamNames.teamA : teamNames.teamB}
              </span>
            </motion.div>
          )}
          
          You should put the audio button code in GameplayScreen.jsx right after the word card, still inside the wordContainer. Here's exactly where:
javascript<div className={styles.wordContainer}>
  <motion.div 
    className={styles.wordCard}
    animate={{ 
      opacity: getVanishingOpacity(),
      scale: preVanishPhase === 'preview' ? 1.05 : 1,
      boxShadow: preVanishPhase === 'preview' 
        ? "0 0 20px rgba(124, 179, 66, 0.6)" 
        : "0 5px 15px rgba(0, 0, 0, 0.1)"
    }}
    transition={{ duration: 0.5 }}
  >
    <div className={`${styles.wordText} ${styles[vanishingStyle]}`}>
      {renderEnhancedWordWithHighlight()}
    </div>
    
    {/* Vanishing style indicator */}
    {preVanishPhase === 'preview' && (
      <motion.div 
        className={styles.vanishStyleIndicator}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        Effect: {vanishingStyle.charAt(0).toUpperCase() + vanishingStyle.slice(1)}
      </motion.div>
    )}
    
    {/* Syllable breakdown hint */}
    {preVanishPhase === 'preview' && wordData.syllableBreakdown && (
      <motion.div 
        className={styles.syllableHint}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        {wordData.syllableBreakdown}
      </motion.div>
    )}
  </motion.div>
  
 
            
            {/* Enhanced phonics pattern highlight */}
            {showPhonicsHint && (
              <motion.div 
                className={styles.phonicsPatternHint}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                Pattern: {getPatternName(wordData.pattern)}
              </motion.div>
            )}
            
            {/* Get ready cue */}
            {preVanishPhase === 'ready' && (
              <motion.div 
                className={styles.readyCue}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <div className={styles.countdown}>
                  Get Ready...
                </div>
              </motion.div>
            )}
            
            {/* Audio playing indicator */}
            {(playingAudio || audioPlaying) && (
              <motion.div 
                className={styles.audioIndicator}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <motion.div 
                  className={styles.audioWave}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                >
                  🔊
                </motion.div>
                Listen carefully...
              </motion.div>
            )}
            
            {/* Teacher hint display */}
            {showHint && (
              <motion.div 
                className={styles.teacherHint}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                Hint: Starts with "{wordData.word?.charAt(0)}" - {wordData.syllableBreakdown?.split('-').length || 1} syllables
              </motion.div>
            )}
          </div>
          
          {/* Response Phase Indicators */}
          <AnimatePresence>
            {responsePhase === 'thinking' && (
              <motion.div 
                className={styles.responsePhase}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className={styles.phaseIcon}>🤔</div>
                <div className={styles.phaseText}>Think Time</div>
                <div className={styles.phaseTimer}>{phaseTimer}s</div>
              </motion.div>
            )}
            
            {responsePhase === 'whisper' && (
              <motion.div 
                className={styles.responsePhase}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className={styles.phaseIcon}>🗣️</div>
                <div className={styles.phaseText}>Whisper to your neighbor</div>
                <div className={styles.phaseTimer}>{phaseTimer}s</div>
              </motion.div>
            )}
            
            {responsePhase === 'response' && showHandRaise && (
              <motion.div 
                className={styles.responsePhase}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className={styles.phaseIcon}>✋</div>
                <div className={styles.phaseText}>Raise your hand if you know!</div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Time left indicator */}
          <div className={styles.timeLeftIndicator}>
            {timeRemaining > 0 && preVanishPhase === 'vanishing' && (
              <motion.div 
                className={styles.timeLeftBadge}
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                {Math.ceil(timeRemaining)}s left
              </motion.div>
            )}
          </div>
          
          {/* Word recognition prompt */}
          <div className={styles.wordPrompt}>
            {vanishState === 'vanished' ? "What was the word?" : 
             discussionMode ? "Discussion Mode - Take your time!" :
             "Do you recognize this word?"}
          </div>
          
          {/* Celebration effects */}
          {celebrationTriggered && (
            <motion.div 
              className={styles.celebrationOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className={styles.celebrationText}>Great Streak! 🎉</div>
              {[...Array(10)].map((_, i) => (
                <motion.div
                  key={i}
                  className={styles.confetti}
                  style={{
                    position: 'absolute',
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [0, -100, 100],
                    x: [0, Math.random() * 100 - 50],
                    rotate: [0, 360],
                    scale: [1, 0.5, 0],
                  }}
                  transition={{
                    duration: 2,
                    ease: "easeOut"
                  }}
                >
                  🎊
                </motion.div>
              ))}
            </motion.div>
          )}
          
          {/* Encouragement message */}
          {encouragementMessage && (
            <motion.div 
              className={styles.encouragementMessage}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              {encouragementMessage}
            </motion.div>
          )}
        </div>
        
        {/* Control Buttons */}
        <div className={styles.controlButtonsContainer}>
            <div className={styles.controlButtons}>
            <motion.button 
              className={styles.responseButton}
              onClick={() => handleUserResponse(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={hasAnswered || preVanishPhase !== 'vanishing' || vanishState !== 'vanished'}
            >
              I know it!
            </motion.button>
            
            <motion.button 
              className={`${styles.responseButton} ${styles.previewButton}`}
              onClick={handleShowWord}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={hasAnswered || preVanishPhase !== 'vanishing' || vanishState !== 'vanished'}
            >
              Show me
            </motion.button>


            <motion.button 
            className={`${styles.responseButton} ${styles.giveUpButton}`}
            onClick={() => handleUserResponse(false)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={hasAnswered || preVanishPhase !== 'vanishing' || vanishState !== 'vanished'}
          >
            Give up
          </motion.button>
            
          <motion.button 
            className={styles.responseButton}
            onClick={handleSkip}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={hasAnswered}
          >
            Skip Word
          </motion.button>
        </div>
      </div>
        
        {/* Game Settings Info */}
        <div className={styles.gameSettings}>
          <span>
            Speed: {speedMultiplier.toFixed(1)}x | 
            {config.highlightTarget ? ' Patterns Highlighted' : ' No Highlighting'} | 
            {config.difficulty} Mode
            {teacherPaused && ' | ⏸️ PAUSED'}
          </span>
        </div>
        
        {/* Teacher Instructions */}
        <div className={styles.teacherInstructions}>
          <div className={styles.instructionItem}>SPACE: Play/Pause</div>
          <div className={styles.instructionItem}>R: Instant Reveal</div>
          <div className={styles.instructionItem}>←/→: Adjust Speed</div>
          <div className={styles.instructionItem}>S: Skip</div>
          <div className={styles.instructionItem}>D: Discussion</div>
          <div className={styles.instructionItem}>H: Hint</div>
        </div>
      </div>
    </div>
  );
};

export default GameplayScreen;