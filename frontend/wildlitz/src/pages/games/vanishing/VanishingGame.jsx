// src/pages/games/vanishing/VanishingGame.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../../styles/games/vanishing/VanishingGame.module.css';
import phonicsAnalyticsService from '../../../services/phonicsAnalyticsService';

// Import game screens
import ConfigScreen from './ConfigScreen';
import GameplayScreen from './GameplayScreen';
import FeedbackScreen from './FeedbackScreen';
import GameCompleteScreen from './GameCompleteScreen';
import GameAnalytics from './GameAnalytics'; // ANALYTICS ADDED

// Import mascot
import WildLitzFox from '../../../assets/img/wildlitz-idle.png';

// Import AI word generation service
import { generateVanishingGameWords } from '../../../services/vanishingGameService';
import { analyticsService } from '../../../services/analyticsService'; // ANALYTICS ADDED

/**
 * Enhanced VanishingGame component with AI-generated content
 */
const VanishingGame = () => {
  // Game states: 'config', 'gameplay', 'feedback', 'complete', 'analytics' - ANALYTICS ADDED
  const [gameState, setGameState] = useState('config');
  
  // Game configuration
  const [gameConfig, setGameConfig] = useState({
    challengeLevel: 'simple_words',
    learningFocus: 'short_vowels',
    difficulty: 'easy',
    highlightTarget: true,
    vanishSpeed: 'normal',
    numberOfQuestions: 10
  });
  
  // Game progress
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(10);
  const [score, setScore] = useState(0);
  const [wordData, setWordData] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [usedWords, setUsedWords] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  
  // Add loading state for word generation
  const [loadingWords, setLoadingWords] = useState(false);
  const [wordGenerationError, setWordGenerationError] = useState(null);
  
  // Character speech bubble
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleMessage, setBubbleMessage] = useState('');
  
  // Session tracking
  const [sessionStartTime, setSessionStartTime] = useState(Date.now());
  const [gameStartTime, setGameStartTime] = useState(Date.now());
  
  // Class energy system
  const [classEnergy, setClassEnergy] = useState(100);
  
  // Team play states
  const [currentTeam, setCurrentTeam] = useState('teamA');
  const [teamScores, setTeamScores] = useState({ teamA: 0, teamB: 0 });
  
  // Enhanced game statistics
  const [gameStats, setGameStats] = useState({
    wordsAttempted: 0,
    wordsRecognized: 0,
    successRate: 0,
    streakCount: 0,
    maxStreak: 0,
    averageResponseTime: 0,
    patternStats: {},
    difficultyProgression: [],
    timeSpent: 0
  });

  /**
   * Handle game start
   */
  const handleStartGame = async (config) => {
  setGameConfig(config);
  setLoadingWords(true);
  setWordGenerationError(null);
  
  try {
    const words = await generateVanishingGameWords(config);
    
    if (!words || words.length === 0) {
      throw new Error('No words generated');
    }
    
    setWordData(words);
    setTotalRounds(config.numberOfQuestions);
    setCurrentRound(1);
    setCurrentWordIndex(0);
    setScore(0);
    setSessionStartTime(Date.now());
    setGameStartTime(Date.now());
    
    // ⭐ ADD THIS: Track initial words as used
    setUsedWords(words.map(w => w.word.toLowerCase()));
    
    if (config.teamPlay) {
      setTeamScores({ teamA: 0, teamB: 0 });
      setCurrentTeam('teamA');
    }
    
    setGameStats({
      wordsAttempted: 0,
      wordsRecognized: 0,
      successRate: 0,
      streakCount: 0,
      maxStreak: 0,
      averageResponseTime: 0,
      patternStats: {},
      difficultyProgression: [],
      timeSpent: 0
    });
    
    setClassEnergy(100);
    setGameState('gameplay');
    
    setBubbleMessage("Let's start! Watch carefully as the words appear and vanish! ✨");
    setShowBubble(true);
    
  } catch (error) {
    console.error('Error generating words:', error);
    setWordGenerationError('Failed to generate words. Please try again.');
  } finally {
    setLoadingWords(false);
  }
};

  /**
   * Handle word result from gameplay
   */
  /**
 * Handle word result from gameplay - WITH SKIP FIX
 * Replace your entire handleWordResult function with this
 */
const handleWordResult = (recognized, word, responseTime) => {
  console.log('🔍 handleWordResult called with recognized =', recognized);
  
  const result = { recognized, word, responseTime };
  setLastResult(result);
  
  // ⭐ FIX 1: Handle "I know it" (recognized === true)
  if (recognized === true) {
    console.log('✅ I KNOW IT BUTTON PRESSED!!!');
    
    // Count as correct attempt
    const newStats = { ...gameStats };
    newStats.wordsAttempted++;
    newStats.wordsRecognized++;
    newStats.timeSpent = Date.now() - sessionStartTime;
    newStats.streakCount++;
    newStats.maxStreak = Math.max(newStats.maxStreak, newStats.streakCount);
    
    // Pattern-specific tracking
    const currentPattern = gameConfig.learningFocus;
    if (!newStats.patternStats[currentPattern]) {
      newStats.patternStats[currentPattern] = { 
        attempted: 0, 
        correct: 0, 
        averageTime: 0 
      };
    }
    newStats.patternStats[currentPattern].attempted++;
    newStats.patternStats[currentPattern].correct++;
    
    // Calculate response time
    const actualResponseTime = responseTime || (Date.now() - gameStartTime) / 1000;
    
    // Update average response time
    newStats.averageResponseTime = 
      (newStats.averageResponseTime * (newStats.wordsAttempted - 1) + actualResponseTime) / 
      newStats.wordsAttempted;
    
    // Update pattern average time
    const patternStats = newStats.patternStats[currentPattern];
    patternStats.averageTime = 
      (patternStats.averageTime * (patternStats.attempted - 1) + actualResponseTime) / 
      patternStats.attempted;
    
    // Calculate success rate
    newStats.successRate = Math.round((newStats.wordsRecognized / newStats.wordsAttempted) * 100);
    
    // Track difficulty progression
    newStats.difficultyProgression.push({
      round: currentRound,
      word: word,
      recognized: true,
      responseTime: actualResponseTime,
      pattern: currentPattern,
      action: 'knew_it'
    });
    
    setGameStats(newStats);
    
    // ✅ FIX: Show bubble message (not alert!)
    setBubbleMessage("Excellent! You got it right! 🎉✨");
    setShowBubble(true);
    console.log('💬 Bubble message set for I KNOW IT!');
    
    // Auto-hide bubble after 3 seconds
    setTimeout(() => {
      setShowBubble(false);
    }, 8000);
    
    setGameState('feedback');
    
    return;
  }
  
  // ⭐ FIX 2: Handle "Give up" (recognized === 'giveup') - REMOVE alert()!
  if (recognized === 'giveup') {
    console.log('👋 GIVE UP HANDLER TRIGGERED!!!');
    // ❌ REMOVED: alert('Give up detected!'); // This blocks the UI!
    
    // Count as incorrect attempt
    const newStats = { ...gameStats };
    newStats.wordsAttempted++;
    newStats.timeSpent = Date.now() - sessionStartTime;
    newStats.streakCount = 0; // Reset streak
    
    // Pattern-specific tracking
    const currentPattern = gameConfig.learningFocus;
    if (!newStats.patternStats[currentPattern]) {
      newStats.patternStats[currentPattern] = { 
        attempted: 0, 
        correct: 0, 
        averageTime: 0 
      };
    }
    newStats.patternStats[currentPattern].attempted++;
    
    // Calculate response time
    const actualResponseTime = responseTime || (Date.now() - gameStartTime) / 1000;
    
    // Update average response time
    newStats.averageResponseTime = 
      (newStats.averageResponseTime * (newStats.wordsAttempted - 1) + actualResponseTime) / 
      newStats.wordsAttempted;
    
    // Update pattern average time
    const patternStats = newStats.patternStats[currentPattern];
    patternStats.averageTime = 
      (patternStats.averageTime * (patternStats.attempted - 1) + actualResponseTime) / 
      patternStats.attempted;
    
    // Calculate success rate
    newStats.successRate = Math.round((newStats.wordsRecognized / newStats.wordsAttempted) * 100);
    
    // Track difficulty progression
    newStats.difficultyProgression.push({
      round: currentRound,
      word: word,
      recognized: false,
      responseTime: actualResponseTime,
      pattern: currentPattern,
      action: 'giveup'
    });
    
    setGameStats(newStats);
    
    // ✅ FIX: Show bubble message properly
    setBubbleMessage("Better luck next time! Every try makes you stronger! 💪");
    setShowBubble(true);
    console.log('💬 Bubble message set for GIVE UP!');
    
    // Auto-hide bubble after 3 seconds
    setTimeout(() => {
      setShowBubble(false);
    }, 8000);
    
    setGameState('feedback');
    
    return;
  }
  
  // ⭐ Handle SKIP (separate from giveup!)
  if (recognized === 'skip') {
    console.log('⏭️ Skip detected - generating new word without affecting progress');
    
    // Check if we've already answered enough words
    if (gameStats.wordsAttempted >= totalRounds) {
      console.log('✅ Already answered enough words, ending game...');
      endGameSession();
      return;
    }
    
    // Switch to loading state RIGHT AWAY
    setGameState('loading');
    
    // Generate new word in background
    (async () => {
      try {
        let newWord = null;
        const maxAttempts = 2;
        
        console.log('📋 Already used words:', usedWords);
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          console.log(`🔄 Attempt ${attempt}/${maxAttempts} to generate unique word...`);
          
          const newWords = await generateVanishingGameWords(gameConfig, 1);
          
          if (newWords && newWords.length > 0) {
            const generatedWord = newWords[0];
            const wordLower = generatedWord.word.toLowerCase();
            
            console.log(`Generated word: "${wordLower}"`);
            
            if (!usedWords.includes(wordLower)) {
              newWord = generatedWord;
              console.log('✅ Found unique word:', wordLower);
              break;
            } else {
              console.log('⚠️ Word already used');
              
              if (attempt < maxAttempts) {
                console.log('⏳ Waiting 500ms before retry...');
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            }
          }
        }
        
        // If we couldn't find unique word, just use the last one
        if (!newWord) {
          const newWords = await generateVanishingGameWords(gameConfig, 1);
          if (newWords && newWords.length > 0) {
            console.log('⚠️ Using duplicate word since pool is small');
            newWord = newWords[0];
          }
        }
        
        if (newWord) {
          const updatedWordData = [...wordData];
          updatedWordData[currentWordIndex] = newWord;
          setWordData(updatedWordData);
          
          setUsedWords(prev => [...prev, newWord.word.toLowerCase()]);
          
          console.log('✅ New word set:', newWord.word);
          
          setGameState('gameplay');
          setGameStartTime(Date.now());
        } else {
          console.log('❌ No word generated, moving to next...');
          
          if (gameStats.wordsAttempted >= totalRounds) {
            endGameSession();
          } else {
            handleNextWord();
          }
        }
      } catch (error) {
        console.error('❌ Error generating new word:', error);
        
        if (gameStats.wordsAttempted >= totalRounds) {
          endGameSession();
        } else {
          handleNextWord();
        }
      }
    })();
    
    return;
  }
  
  // ⭐ Handle NULL (legacy skip)
  if (recognized === null) {
    const newStats = { ...gameStats };
    newStats.timeSpent = Date.now() - sessionStartTime;
    
    newStats.difficultyProgression.push({
      round: currentRound,
      word: word,
      recognized: null,
      responseTime,
      pattern: gameConfig.learningFocus,
      action: 'skipped'
    });
    
    setGameStats(newStats);
    setBubbleMessage("Word skipped! Let's try the next one! ⏭️");
    setShowBubble(true);
    
    // Auto-hide bubble after 3 seconds
    setTimeout(() => {
      setShowBubble(false);
    }, 8000);
    
    setGameState('feedback');
    return;
  }
  
  // ===== NORMAL WORD PROCESSING (for false - incorrect answer) =====
  
  if (gameConfig.teamPlay) {
    if (recognized) {
      setTeamScores(prev => ({
        ...prev,
        [currentTeam]: prev[currentTeam] + 1
      }));
    }
    setCurrentTeam(prev => prev === 'teamA' ? 'teamB' : 'teamA');
  }
  
  const newStats = { ...gameStats };
  newStats.wordsAttempted++;
  newStats.timeSpent = Date.now() - sessionStartTime;
  
  if (recognized) {
    newStats.wordsRecognized++;
    newStats.streakCount++;
    newStats.maxStreak = Math.max(newStats.maxStreak, newStats.streakCount);
  } else {
    newStats.streakCount = 0;
  }
  
  const currentPattern = gameConfig.learningFocus;
  if (!newStats.patternStats[currentPattern]) {
    newStats.patternStats[currentPattern] = { 
      attempted: 0, 
      correct: 0, 
      averageTime: 0 
    };
  }
  newStats.patternStats[currentPattern].attempted++;
  if (recognized) {
    newStats.patternStats[currentPattern].correct++;
  }
  
  const actualResponseTime = responseTime || (Date.now() - gameStartTime) / 1000;
  
  newStats.averageResponseTime = 
    (newStats.averageResponseTime * (newStats.wordsAttempted - 1) + actualResponseTime) / 
    newStats.wordsAttempted;
  
  const patternStats = newStats.patternStats[currentPattern];
  patternStats.averageTime = 
    (patternStats.averageTime * (patternStats.attempted - 1) + actualResponseTime) / 
    patternStats.attempted;
  
  newStats.successRate = Math.round((newStats.wordsRecognized / newStats.wordsAttempted) * 100);
  
  newStats.difficultyProgression.push({
    round: currentRound,
    word: word,
    recognized: recognized,
    responseTime: actualResponseTime,
    pattern: currentPattern,
    action: recognized ? 'correct' : 'incorrect'
  });
  
  setGameStats(newStats);
  
  let feedbackMessage;
  if (recognized) {
    if (gameConfig.teamPlay) {
      const teamName = currentTeam === 'teamA' ? 
        (gameConfig.teamAName || 'Team A') : 
        (gameConfig.teamBName || 'Team B');
      feedbackMessage = `Fantastic! +1 point for ${teamName}! 🎉`;
    } else {
      feedbackMessage = "Excellent! You got it right! 🎉";
    }
  } else {
    if (gameConfig.teamPlay) {
      feedbackMessage = "That's okay! Let the other team give it a try!";
    } else {
      feedbackMessage = "That's okay! Every attempt helps you learn. Let's keep going!";
    }
  }
  
  setBubbleMessage(feedbackMessage);
  setShowBubble(true);
  
  // Auto-hide bubble after 3 seconds
  setTimeout(() => {
    setShowBubble(false);
  }, 8000);
  
  setGameState('feedback');
};

  /**
   * Handle moving to next word - FIXED
   */
  const handleNextWord = () => {
  console.log(`Current round: ${currentRound}, Total rounds: ${totalRounds}`);
  console.log(`Current word index: ${currentWordIndex}, Word data length: ${wordData.length}`);
  console.log(`Words attempted: ${gameStats.wordsAttempted}`);
  
  // ⭐ NEW: Check if we should end the game
  // End if we've completed enough rounds OR run out of words
  const shouldEndGame = currentRound >= totalRounds || 
                        currentWordIndex >= wordData.length - 1 ||
                        gameStats.wordsAttempted >= totalRounds;
  
  if (shouldEndGame) {
    console.log('Game should end now');
    endGameSession();
  } else {
    // Track the word before moving to next
    if (wordData[currentWordIndex]) {
      const currentWord = wordData[currentWordIndex].word.toLowerCase();
      if (!usedWords.includes(currentWord)) {
        setUsedWords(prev => [...prev, currentWord]);
      }
    }
    
    setCurrentWordIndex(prevIndex => prevIndex + 1);
    setCurrentRound(prevRound => prevRound + 1);
    setGameState('gameplay');
    setGameStartTime(Date.now());
  }
};

  /**
   * Handle retrying current word
   */
  const handleRetryWord = () => {
    setGameState('gameplay');
    setGameStartTime(Date.now());
  };

  /**
   * End game session with enhanced analytics
   */
  // Inside your component, find the endGameSession function:
const endGameSession = async () => {
  // Calculate final statistics
  const finalStats = {
    ...gameStats,
    timeSpent: Date.now() - sessionStartTime,
    sessionDuration: Date.now() - sessionStartTime,
    completionRate: (currentRound / totalRounds) * 100,
    wordsPerMinute: (gameStats.wordsAttempted / ((Date.now() - sessionStartTime) / 60000)).toFixed(1),
    learningEfficiency: gameStats.successRate * (gameStats.wordsAttempted / totalRounds),
  };
  
  setGameStats(finalStats);
  
  try {
    console.log('📊 Saving game analytics to Supabase...');
    
    // Clean the data
    const cleanStats = {
      ...finalStats,
      // ⭐ FIX: Replace null with 0
      averageResponseTime: finalStats.averageResponseTime || 0,
      // ⭐ FIX: Clean patternStats to remove null values
      patternStats: Object.entries(finalStats.patternStats || {}).reduce((acc, [key, value]) => {
        acc[key] = {
          attempted: value.attempted || 0,
          correct: value.correct || 0,
          averageTime: value.averageTime || 0  // Replace null with 0
        };
        return acc;
      }, {}),
      // ⭐ FIX: Filter out skipped items
      difficultyProgression: (finalStats.difficultyProgression || [])
        .filter(item => item && item.recognized !== null && item.action !== 'skipped')
        .map(({ action, ...rest }) => rest)
    };
    
    const sessionData = phonicsAnalyticsService.formatSessionData(
      cleanStats,
      gameConfig, 
      // ⭐ FIX: Only send words that were actually attempted
      wordData.slice(0, finalStats.wordsAttempted || wordData.length)
    );
    
    // ⭐ FIX: Clean the session data to match actual attempts
    const cleanedSessionData = {
      ...sessionData,
      // Only send data for words that were actually attempted
      words: sessionData.words.slice(0, finalStats.wordsAttempted),
      wordList: sessionData.wordList.slice(0, finalStats.wordsAttempted),
      recognized: sessionData.recognized.slice(0, finalStats.wordsAttempted),
      responseTimes: sessionData.responseTimes.slice(0, finalStats.wordsAttempted),
      // Ensure no null values
      averageResponseTime: sessionData.averageResponseTime || 0
    };
    
    console.log('🔍 Cleaned session data:', JSON.stringify(cleanedSessionData, null, 2));
    
    const result = await phonicsAnalyticsService.saveGameSession(cleanedSessionData);
    
    if (result && result.success) {
      console.log('✅ Analytics saved successfully!', result.session_id || result.message);
    } else {
      console.warn('⚠️ Analytics save returned:', result);
    }
  } catch (error) {
    console.error('❌ Failed to save analytics:', error.message || error);
  }
  
  setGameState('complete');
  
  let finalMessage;
  if (finalStats.successRate >= 90) {
    finalMessage = "Outstanding performance! You're a reading superstar! ⭐";
  } else if (finalStats.successRate >= 70) {
    finalMessage = "Great work! You've made excellent progress today! 🎉";
  } else if (finalStats.successRate >= 50) {
    finalMessage = "Good effort! Practice makes perfect. Keep it up! 👍";
  } else {
    finalMessage = "Thank you for practicing! Every attempt helps you grow! 🌱";
  }
  
  setBubbleMessage(finalMessage);
  setShowBubble(true);
};

  /**
   * Handle playing the game again
   */
  const handlePlayAgain = () => {
    setGameState('config');
    setShowBubble(false);
    setUsedWords([]);
  };

  // ANALYTICS ADDED: View analytics handler
  const handleViewAnalytics = () => {
    setGameState('analytics');
  };

  // ANALYTICS ADDED: Back from analytics handler
  const handleBackFromAnalytics = () => {
    setGameState('config');
  };
  // END ANALYTICS ADDED

  /**
   * Determine if the mascot should be shown
   */
  const shouldShowMascot = () => {
    return gameState !== 'config' && gameState !== 'analytics'; // ANALYTICS ADDED
  };

  /**
   * Render the current word for gameplay - FIXED
   */
  const getCurrentWord = () => {
    if (wordData.length === 0 || currentWordIndex >= wordData.length) {
      return { 
        word: '', 
        pattern: '', 
        patternPosition: '',
        syllableBreakdown: '',
        syllableCount: 1,
        category: 'General'
      };
    }
    
    return wordData[currentWordIndex];
  };

  /**
   * Enhanced progress calculation
   */
  const getDetailedProgress = () => {
    return {
      current: currentRound,
      total: totalRounds,
      percentage: (currentRound / totalRounds) * 100,
      remaining: totalRounds - currentRound,
      score: score,
      accuracy: gameStats.wordsAttempted > 0 ? gameStats.successRate : 0,
      streak: gameStats.streakCount,
      maxStreak: gameStats.maxStreak
    };
  };

  // ANALYTICS ADDED: Show analytics if in analytics state
  if (gameState === 'analytics') {
    return <GameAnalytics onBack={handleBackFromAnalytics} />;
  }
  // END ANALYTICS ADDED

  return (
    <div className={styles.gameContainer}>
      <div className={styles.gameContent}>
        {/* Enhanced Progress indicator - Fixed position */}
        {gameState !== 'config' && (
          <div className={styles.progressIndicator}>
            <div className={styles.progressLabel}>
              <span>Progress</span>
              <div className={styles.progressNumbers}>
                {currentRound}/{totalRounds}
              </div>
            </div>
            <div className={styles.progressBar}>
              <motion.div 
                className={styles.progressFill}
                initial={{ width: "0%" }}
                animate={{ 
                  width: `${getDetailedProgress().percentage}%` 
                }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className={styles.progressStats}>
              <span>Score: {score}</span>
              <span>Accuracy: {gameStats.successRate}%</span>
              {gameStats.streakCount > 0 && (
                <span className={styles.streakBadge}>Streak: {gameStats.streakCount}</span>
              )}
            </div>
          </div>
        )}
        
        {/* Team Score Display - Only show in team play mode */}
        {gameState !== 'config' && gameConfig.teamPlay && (
          <div className={styles.teamScoreBoard}>
            <div className={`${styles.teamScore} ${currentTeam === 'teamA' ? styles.activeTeam : ''}`}>
              <div className={styles.teamName}>{gameConfig.teamAName}</div>
              <div className={styles.teamPoints}>{teamScores.teamA}</div>
            </div>
            <div className={styles.scoreDivider}>VS</div>
            <div className={`${styles.teamScore} ${currentTeam === 'teamB' ? styles.activeTeam : ''}`}>
              <div className={styles.teamName}>{gameConfig.teamBName}</div>
              <div className={styles.teamPoints}>{teamScores.teamB}</div>
            </div>
          </div>
        )}
        
        {/* Enhanced Fox Mascot - Fixed position */}
        {shouldShowMascot() && (
          <motion.div
            className={styles.foxMascot}
            animate={{ 
              y: [0, -8, 0],
              rotate: [0, 2, 0, -2, 0]
            }}
            transition={{ 
              y: { repeat: Infinity, duration: 3, ease: "easeInOut" },
              rotate: { repeat: Infinity, duration: 2, ease: "easeInOut" }
            }}
          >
            <img src={WildLitzFox} alt="WildLitz Fox" className={styles.foxImage} />
            
            {showBubble && (
              <motion.div 
                className={styles.speechBubble}
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                transition={{ duration: 0.3 }}
              >
                {bubbleMessage}
              </motion.div>
            )}
          </motion.div>
        )}
        
        {/* Enhanced Game Screens - Full container */}
        <AnimatePresence mode="wait">
          {gameState === 'config' && (
            <motion.div
              key="config"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={styles.screenContainer}
            >
              <ConfigScreen 
                onStartGame={handleStartGame}
                onViewAnalytics={handleViewAnalytics} // ANALYTICS ADDED
                loading={loadingWords}
                error={wordGenerationError}
              />
            </motion.div>
          )}

          {gameState === 'loading' && (
  <motion.div
    key="loading"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 1.1 }}
    className={styles.screenContainer}
    style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      background: 'rgba(255, 255, 255, 0.95)'
    }}
  >
    <motion.div
      animate={{
        rotate: 360,
        scale: [1, 1.2, 1]
      }}
      transition={{
        rotate: { duration: 1, repeat: Infinity, ease: "linear" },
        scale: { duration: 0.5, repeat: Infinity }
      }}
      style={{
        fontSize: '4rem',
        marginBottom: '20px'
      }}
    >
      ⏳
    </motion.div>
    <motion.p
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      style={{
        fontSize: '1.5rem',
        color: '#333',
        fontWeight: 'bold'
      }}
    >
      Finding a new word...
    </motion.p>
  </motion.div>
)}
          
          {gameState === 'gameplay' && (
  <motion.div
    key="gameplay"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className={styles.screenContainer}
    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
  >
    <GameplayScreen 
  key={`${currentWordIndex}-${wordData[currentWordIndex]?.word}-${Date.now()}`}
  wordData={getCurrentWord()}
  config={gameConfig}
  onResult={handleWordResult}
  round={currentRound}
  totalRounds={totalRounds}
  gameStats={gameStats}
  onStatsUpdate={setGameStats}
  classEnergy={classEnergy}
  onEnergyUpdate={setClassEnergy}
  teamPlay={gameConfig.teamPlay}
  currentTeam={currentTeam}
  teamScores={teamScores}
  teamNames={{
    teamA: gameConfig.teamAName || 'Team A',
    teamB: gameConfig.teamBName || 'Team B'
  }}
/>
  </motion.div>
)}
          
          {gameState === 'feedback' && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, rotateY: 90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: -90 }}
              className={styles.screenContainer}
            >
              <FeedbackScreen 
                wordData={getCurrentWord()}
                config={gameConfig}
                onNextWord={handleNextWord}
                onRetry={handleRetryWord}
                success={lastResult?.recognized || false}
                result={lastResult}
                gameStats={gameStats}
              />
            </motion.div>
          )}
          
          {gameState === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className={styles.screenContainer}
            >
              <GameCompleteScreen 
                stats={gameStats}
                config={gameConfig}
                score={score}
                totalWords={totalRounds}
                onPlayAgain={handlePlayAgain}
                onViewAnalytics={handleViewAnalytics} // ANALYTICS ADDED
                teamScores={teamScores}
                teamNames={{
                  teamA: gameConfig.teamAName || 'Team A',
                  teamB: gameConfig.teamBName || 'Team B'
                }}
                sessionData={{
                  startTime: sessionStartTime,
                  endTime: Date.now(),
                  difficulty: gameConfig.difficulty,
                  challengeLevel: gameConfig.challengeLevel,
                  learningFocus: gameConfig.learningFocus
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VanishingGame;