// src/pages/games/vanishing/VanishingGame.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../../styles/games/vanishing/VanishingGame.module.css';

// Import game screens
import ConfigScreen from './ConfigScreen';
import GameplayScreen from './GameplayScreen';
import FeedbackScreen from './FeedbackScreen';
import GameCompleteScreen from './GameCompleteScreen';

// Import mascot
import WildLitzFox from '../../../assets/img/wildlitz-idle.png';

// Import AI word generation service
import { generateVanishingGameWords } from '../../../services/vanishingGameService';

/**
 * Enhanced VanishingGame component with AI-generated content
 */
const VanishingGame = () => {
  // Game states: 'config', 'gameplay', 'feedback', 'complete'
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
  const [lastResult, setLastResult] = useState(null);
  
  // Add loading state for word generation
  const [loadingWords, setLoadingWords] = useState(false);
  const [wordGenerationError, setWordGenerationError] = useState(null);
  
  // Character speech bubble
  const [showBubble, setShowBubble] = useState(false);
  const [bubbleMessage, setBubbleMessage] = useState("");
  
  // Enhanced stats tracking with proper energy management
  const [gameStats, setGameStats] = useState({
    wordsAttempted: 0,
    wordsRecognized: 0,
    successRate: 0,
    patternStats: {},
    streakCount: 0,
    maxStreak: 0,
    averageResponseTime: 0,
    difficultyProgression: [],
    timeSpent: 0,
    participationMetrics: {
      handsRaised: 0,
      discussionTime: 0,
      hintsUsed: 0,
      pauseCount: 0
    },
    wordsPlayed: [] // Track actual words played
  });
  
  // Class energy state
  const [classEnergy, setClassEnergy] = useState(100);
  
  // Session tracking
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [gameStartTime, setGameStartTime] = useState(null);
  
  /**
   * Handle starting a new game with AI-generated words
   */
  const handleStartGame = async (config) => {
    console.log('Starting game with config:', config); // Debug log
    
    setGameConfig(config);
    setCurrentRound(1);
    setScore(0);
    setCurrentWordIndex(0);
    setLastResult(null);
    setSessionStartTime(Date.now());
    setGameStartTime(Date.now());
    setLoadingWords(true);
    setWordGenerationError(null);
    
    // FIXED: Use the actual numberOfQuestions from config
    const questionsToGenerate = config.numberOfQuestions || 10;
    setTotalRounds(questionsToGenerate);
    
    try {
      // Generate words using AI with the correct number
      setBubbleMessage(`Generating ${questionsToGenerate} unique words for your session...`);
      setShowBubble(true);
      
      const words = await generateVanishingGameWords(config, questionsToGenerate);
      
      // Add metadata to each word
      const enhancedWords = words.map((wordItem, index) => ({
        ...wordItem,
        id: `ai_generated_${index}`,
        wordIndex: index
      }));
      
      console.log(`Generated ${enhancedWords.length} words for ${questionsToGenerate} questions`); // Debug log
      
      setWordData(enhancedWords);
      
      // FIXED: Set total rounds to exactly the number of questions requested
      setTotalRounds(questionsToGenerate);
      
      // Initialize enhanced stats
      setGameStats({
        wordsAttempted: 0,
        wordsRecognized: 0,
        successRate: 0,
        patternStats: {
          [config.learningFocus]: { attempted: 0, correct: 0, averageTime: 0 }
        },
        streakCount: 0,
        maxStreak: 0,
        averageResponseTime: 0,
        difficultyProgression: [],
        timeSpent: 0,
        participationMetrics: {
          handsRaised: 0,
          discussionTime: 0,
          hintsUsed: 0,
          pauseCount: 0
        },
        wordsPlayed: enhancedWords.slice(0, questionsToGenerate).map(w => w.word) // Only track the words we'll actually play
      });
      
      // Move to gameplay state
      setGameState('gameplay');
      
      // Show enhanced welcome message
      const welcomeMessages = {
        simple_words: "Let's practice reading simple words!",
        compound_words: "Time to tackle compound words!",
        phrases: "Ready to read some phrases?",
        simple_sentences: "Let's work on reading sentences!"
      };
      
      setTimeout(() => {
        setBubbleMessage(welcomeMessages[config.challengeLevel] || "Ready to practice reading?");
        
        // Hide bubble after 5 seconds
        setTimeout(() => {
          setShowBubble(false);
        }, 5000);
      }, 1000);
      
    } catch (error) {
      console.error('Error generating words:', error);
      setWordGenerationError('Failed to generate words. Please try again.');
      setBubbleMessage("Oops! Let's try that again.");
      
      // Hide error after 3 seconds and return to config
      setTimeout(() => {
        setWordGenerationError(null);
        setShowBubble(false);
      }, 3000);
    } finally {
      setLoadingWords(false);
    }
  };

  /**
   * Enhanced word result handling
   */
  const handleWordResult = (recognized, word) => {
    const responseTime = Date.now() - gameStartTime;
    setLastResult({ recognized, word, responseTime });
    
    // Update enhanced stats
    const newStats = { ...gameStats };
    newStats.wordsAttempted++;
    newStats.timeSpent = Date.now() - sessionStartTime;
    
    // Pattern-specific tracking
    const currentPattern = gameConfig.learningFocus;
    if (!newStats.patternStats[currentPattern]) {
      newStats.patternStats[currentPattern] = { attempted: 0, correct: 0, averageTime: 0 };
    }
    newStats.patternStats[currentPattern].attempted++;
    
    if (recognized) {
      newStats.wordsRecognized++;
      newStats.patternStats[currentPattern].correct++;
      newStats.streakCount++;
      newStats.maxStreak = Math.max(newStats.maxStreak, newStats.streakCount);
      setScore(prevScore => prevScore + 1);
    } else {
      newStats.streakCount = 0;
    }
    
    // Update average response time
    newStats.averageResponseTime = (newStats.averageResponseTime * (newStats.wordsAttempted - 1) + responseTime) / newStats.wordsAttempted;
    
    // Update pattern average time
    const patternStats = newStats.patternStats[currentPattern];
    patternStats.averageTime = (patternStats.averageTime * (patternStats.attempted - 1) + responseTime) / patternStats.attempted;
    
    // Calculate success rate
    newStats.successRate = Math.round((newStats.wordsRecognized / newStats.wordsAttempted) * 100);
    
    // Track difficulty progression
    newStats.difficultyProgression.push({
      round: currentRound,
      word: word,
      recognized,
      responseTime,
      pattern: currentPattern
    });
    
    setGameStats(newStats);
    
    // Show enhanced feedback based on result
    setGameState('feedback');
    
    // Enhanced feedback messages
    let feedbackMessage;
    if (recognized) {
      if (newStats.streakCount === 1) {
        feedbackMessage = "Great job! You recognized that word correctly!";
      } else if (newStats.streakCount === 3) {
        feedbackMessage = "Amazing streak! You're on fire! 🔥";
      } else if (newStats.streakCount >= 5) {
        feedbackMessage = `Incredible! ${newStats.streakCount} words in a row! 🌟`;
      } else {
        feedbackMessage = `Excellent! That's ${newStats.streakCount} correct in a row!`;
      }
    } else {
      feedbackMessage = "That's okay! Every attempt helps you learn. Let's keep going!";
    }
    
    setBubbleMessage(feedbackMessage);
    setShowBubble(true);
    
    // Hide bubble after 4 seconds
    setTimeout(() => {
      setShowBubble(false);
    }, 4000);
  };

  /**
   * Handle moving to next word - FIXED
   */
  const handleNextWord = () => {
    console.log(`Current round: ${currentRound}, Total rounds: ${totalRounds}`); // Debug log
    console.log(`Current word index: ${currentWordIndex}, Word data length: ${wordData.length}`); // Debug log
    
    // FIXED: Check against totalRounds (not array length)
    if (currentRound >= totalRounds) {
      console.log('Game should end now'); // Debug log
      // End of game
      endGameSession();
    } else {
      // Move to next word
      setCurrentWordIndex(prevIndex => prevIndex + 1);
      setCurrentRound(prevRound => prevRound + 1);
      setGameState('gameplay');
      setGameStartTime(Date.now()); // Reset timer for next word
    }
  };

  /**
   * Handle retrying current word
   */
  const handleRetryWord = () => {
    setGameState('gameplay');
    setGameStartTime(Date.now()); // Reset timer for retry
  };

  /**
   * End game session with enhanced analytics
   */
  const endGameSession = () => {
    const finalStats = {
      ...gameStats,
      timeSpent: Date.now() - sessionStartTime,
      sessionDuration: Date.now() - sessionStartTime,
      completionRate: (currentRound / totalRounds) * 100,
      wordsPerMinute: (gameStats.wordsAttempted / ((Date.now() - sessionStartTime) / 60000)).toFixed(1),
      learningEfficiency: gameStats.successRate * (gameStats.wordsAttempted / totalRounds),
      patternMastery: Object.keys(gameStats.patternStats).map(pattern => ({
        pattern,
        mastery: (gameStats.patternStats[pattern].correct / gameStats.patternStats[pattern].attempted * 100).toFixed(1)
      }))
    };
    
    setGameStats(finalStats);
    setGameState('complete');
    
    // Final celebration message
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
  };

  /**
   * Determine if the mascot should be shown
   */
  const shouldShowMascot = () => {
    return gameState !== 'config';
  };

  /**
   * Render the current word for gameplay - FIXED
   */
  const getCurrentWord = () => {
    // FIXED: Check bounds properly
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
                loading={loadingWords}
                error={wordGenerationError}
              />
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
                wordData={getCurrentWord()}
                config={gameConfig}
                onResult={handleWordResult}
                round={currentRound}
                totalRounds={totalRounds}
                gameStats={gameStats}
                onStatsUpdate={setGameStats}
                classEnergy={classEnergy}
                onEnergyUpdate={setClassEnergy}
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