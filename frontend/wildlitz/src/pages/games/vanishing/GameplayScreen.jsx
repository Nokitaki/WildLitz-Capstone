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
  const lowerPattern = pattern.toLowerCase();
  
  // ============================================
  // COMPREHENSIVE PATTERN LISTS
  // ============================================
  
  // ALL Long Vowel Patterns (organized by vowel sound)
  const LONG_A_PATTERNS = ['ai', 'ay', 'a_e', 'ea', 'ei', 'eigh', 'ey'];
  const LONG_E_PATTERNS = ['ee', 'ea', 'e_e', 'ie', 'ei', 'ey'];
  const LONG_I_PATTERNS = ['ie', 'igh', 'i_e', 'uy'];
  const LONG_O_PATTERNS = ['oa', 'ow', 'o_e', 'oe', 'ou', 'ough'];
  const LONG_U_PATTERNS = ['ue', 'ui', 'u_e', 'ew', 'oo', 'ou'];
  
  const ALL_VOWEL_TEAMS = [
    ...LONG_A_PATTERNS,
    ...LONG_E_PATTERNS,
    ...LONG_I_PATTERNS,
    ...LONG_O_PATTERNS,
    ...LONG_U_PATTERNS
  ];
  
  // ALL Digraphs
  const ALL_DIGRAPHS = [
    'sh', 'ch', 'th', 'wh', 'ph',     // Common digraphs
    'gh', 'ck', 'ng', 'qu',            // Other digraphs
    'tch', 'dge',                      // 3-letter digraphs
    'ss', 'zz', 'ff', 'll'             // Double consonants
  ];
  
  // ALL Blends (sorted longest first)
  const ALL_BLENDS = [
    // 3-letter blends
    'scr', 'spr', 'str', 'spl', 'shr', 'thr', 'squ',
    // 2-letter blends (beginning)
    'bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr',
    'pl', 'pr', 'sc', 'sk', 'sl', 'sm', 'sn', 'sp', 'st',
    'sw', 'tr', 'tw',
    // Ending blends
    'ld', 'nd', 'ng', 'nk', 'nt', 'mp', 'lt', 'lp', 'lf', 'lk',
    'ft', 'pt', 'ct', 'xt'
  ];
  
  // ============================================
  // 1. MAGIC-E PATTERNS (a_e, i_e, o_e, u_e, e_e)
  // ============================================
  if (lowerPattern.includes('_')) {
    const [vowel, e] = lowerPattern.split('_');
    
    // Try exact magic-e first
    for (let i = 0; i < lowerText.length - 2; i++) {
      if (lowerText[i] === vowel && 
          lowerText[i + 2] === e && 
          lowerText[i + 1] !== ' ') {
        if (charIndex === i || charIndex === i + 2) {
          return true;
        }
      }
    }
    
    // ✅ FALLBACK: Search ALL vowel teams for this vowel
    let vowelTeamsForVowel = [];
    if (vowel === 'a') vowelTeamsForVowel = LONG_A_PATTERNS;
    else if (vowel === 'e') vowelTeamsForVowel = LONG_E_PATTERNS;
    else if (vowel === 'i') vowelTeamsForVowel = LONG_I_PATTERNS;
    else if (vowel === 'o') vowelTeamsForVowel = LONG_O_PATTERNS;
    else if (vowel === 'u') vowelTeamsForVowel = LONG_U_PATTERNS;
    
    for (const team of vowelTeamsForVowel) {
      if (team.includes('_')) {
        continue; // Skip magic-e patterns (already checked)
      }
      
      let teamStart = 0;
      while (true) {
        const index = lowerText.indexOf(team, teamStart);
        if (index === -1) break;
        
        if (charIndex >= index && charIndex < index + team.length) {
          return true;
        }
        teamStart = index + 1;
      }
    }
    
    return false;
  }
  
  // ============================================
  // 2. VOWEL TEAMS & LONG VOWELS
  // ============================================
  if (lowerPattern.includes('vowel_team_') || lowerPattern.includes('long_')) {
    const extractedPattern = lowerPattern.replace('vowel_team_', '').replace('long_', '');
    
    // Try exact pattern first
    if (extractedPattern.length > 0) {
      let startIndex = 0;
      while (true) {
        const index = lowerText.indexOf(extractedPattern, startIndex);
        if (index === -1) break;
        
        if (charIndex >= index && charIndex < index + extractedPattern.length) {
          return true;
        }
        startIndex = index + 1;
      }
    }
    
    // ✅ FALLBACK: Search ALL vowel teams
    for (const team of ALL_VOWEL_TEAMS) {
      if (team.includes('_')) {
        // Handle magic-e
        const [vowel, e] = team.split('_');
        for (let i = 0; i < lowerText.length - 2; i++) {
          if (lowerText[i] === vowel && 
              lowerText[i + 2] === e && 
              lowerText[i + 1] !== ' ') {
            if (charIndex === i || charIndex === i + 2) {
              return true;
            }
          }
        }
      } else {
        // Handle vowel teams
        let teamStart = 0;
        while (true) {
          const index = lowerText.indexOf(team, teamStart);
          if (index === -1) break;
          
          if (charIndex >= index && charIndex < index + team.length) {
            return true;
          }
          teamStart = index + 1;
        }
      }
    }
    
    return false;
  }
  
  // ============================================
  // 3. SHORT VOWELS
  // ============================================
  if (lowerPattern.includes('short_')) {
    const vowel = lowerPattern.replace('short_', '');
    
    // Find ALL occurrences of this vowel
    let startIndex = 0;
    while (true) {
      const index = lowerText.indexOf(vowel, startIndex);
      if (index === -1) break;
      
      if (charIndex === index) {
        return true;
      }
      startIndex = index + 1;
    }
    
    return false;
  }
  
  // ============================================
  // 4. DIGRAPHS
  // ============================================
  if (lowerPattern.includes('digraph_') || lowerPattern === 'digraphs') {
    const extractedDigraph = lowerPattern.replace('digraph_', '');
    
    // Try exact digraph first
    if (extractedDigraph && extractedDigraph !== 'digraphs') {
      let startIndex = 0;
      while (true) {
        const index = lowerText.indexOf(extractedDigraph, startIndex);
        if (index === -1) break;
        
        if (charIndex >= index && charIndex < index + extractedDigraph.length) {
          return true;
        }
        startIndex = index + 1;
      }
    }
    
    // ✅ FALLBACK: Search ALL digraphs (longest first)
    const sortedDigraphs = [...ALL_DIGRAPHS].sort((a, b) => b.length - a.length);
    
    for (const dg of sortedDigraphs) {
      let dgStart = 0;
      while (true) {
        const index = lowerText.indexOf(dg, dgStart);
        if (index === -1) break;
        
        if (charIndex >= index && charIndex < index + dg.length) {
          return true;
        }
        dgStart = index + 1;
      }
    }
    
    return false;
  }
  
  // ============================================
  // 5. BLENDS
  // ============================================
  if (lowerPattern.includes('blend_') || lowerPattern === 'blends') {
    const extractedBlend = lowerPattern.replace('blend_', '');
    
    // Try exact blend first
    if (extractedBlend && extractedBlend !== 'blends') {
      let startIndex = 0;
      while (true) {
        const index = lowerText.indexOf(extractedBlend, startIndex);
        if (index === -1) break;
        
        if (charIndex >= index && charIndex < index + extractedBlend.length) {
          return true;
        }
        startIndex = index + 1;
      }
    }
    
    // ✅ FALLBACK: Search ALL blends (longest first)
    const sortedBlends = [...ALL_BLENDS].sort((a, b) => b.length - a.length);
    
    for (const bl of sortedBlends) {
      let blStart = 0;
      while (true) {
        const index = lowerText.indexOf(bl, blStart);
        if (index === -1) break;
        
        if (charIndex >= index && charIndex < index + bl.length) {
          return true;
        }
        blStart = index + 1;
      }
    }
    
    return false;
  }
  
  // ============================================
  // 6. GENERIC FALLBACK (try as consecutive pattern)
  // ============================================
  let startIndex = 0;
  while (true) {
    const index = lowerText.indexOf(lowerPattern, startIndex);
    if (index === -1) break;
    
    if (charIndex >= index && charIndex < index + lowerPattern.length) {
      return true;
    }
    startIndex = index + 1;
  }
  
  // ============================================
  // 7. ✨ SMART ULTIMATE FALLBACK ✨
  // Only search related patterns based on category
  // ============================================
  
  // Determine what category we're searching for
  const isVowelSearch = lowerPattern.includes('vowel') || 
                        lowerPattern.includes('long') || 
                        lowerPattern.includes('short') ||
                        'aeiou'.includes(lowerPattern);
  
  const isBlendSearch = lowerPattern.includes('blend') || 
                        ALL_BLENDS.includes(lowerPattern);
  
  const isDigraphSearch = lowerPattern.includes('digraph') || 
                          ALL_DIGRAPHS.includes(lowerPattern);
  
  // Only search blends if we're looking for blends
  if (isBlendSearch) {
    const sortedBlends = [...ALL_BLENDS].sort((a, b) => b.length - a.length);
    for (const bl of sortedBlends) {
      let blStart = 0;
      while (true) {
        const index = lowerText.indexOf(bl, blStart);
        if (index === -1) break;
        
        if (charIndex >= index && charIndex < index + bl.length) {
          return true;
        }
        blStart = index + 1;
      }
    }
  }
  
  // Only search digraphs if we're looking for digraphs
  if (isDigraphSearch) {
    const sortedDigraphs = [...ALL_DIGRAPHS].sort((a, b) => b.length - a.length);
    for (const dg of sortedDigraphs) {
      let dgStart = 0;
      while (true) {
        const index = lowerText.indexOf(dg, dgStart);
        if (index === -1) break;
        
        if (charIndex >= index && charIndex < index + dg.length) {
          return true;
        }
        dgStart = index + 1;
      }
    }
  }
  
  // Only search vowel teams if we're looking for vowels/long vowels
  if (isVowelSearch) {
    for (const team of ALL_VOWEL_TEAMS) {
      if (team.includes('_')) {
        const [vowel, e] = team.split('_');
        for (let i = 0; i < lowerText.length - 2; i++) {
          if (lowerText[i] === vowel && 
              lowerText[i + 2] === e && 
              lowerText[i + 1] !== ' ' &&
              lowerText[i + 1] !== vowel) {
            if (charIndex === i || charIndex === i + 2) {
              return true;
            }
          }
        }
      } else {
        let teamStart = 0;
        while (true) {
          const index = lowerText.indexOf(team, teamStart);
          if (index === -1) break;
          
          if (charIndex >= index && charIndex < index + team.length) {
            return true;
          }
          teamStart = index + 1;
        }
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

  // Timer countdown
  useEffect(() => {
    if (preVanishPhase === 'vanishing' && vanishState === 'vanished' && !hasAnswered) {
      if (timeRemaining > 0) {
        const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
        return () => clearTimeout(timer);
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
  
  setTimeout(() => {
    onResult(true, word, 5 - timeRemaining);
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