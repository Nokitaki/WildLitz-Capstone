// src/pages/games/vanishing/VanishingGame.jsx - REDESIGNED FOR KIDS
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../../styles/games/vanishing/VanishingGame.module.css';
import phonicsAnalyticsService from '../../../services/phonicsAnalyticsService';

// Import game screens
import ConfigScreen from './ConfigScreen';
import GameplayScreen from './GameplayScreen';
import FeedbackScreen from './FeedbackScreen';
import GameCompleteScreen from './GameCompleteScreen';
import GameAnalytics from './GameAnalytics';

// Import mascot - KEEPING THE CUTE MASCOT!
import WildLitzFox from '../../../assets/img/wildlitz-idle.png';

// Import AI word generation service
import { generateVanishingGameWords } from '../../../services/vanishingGameService';
import { analyticsService } from '../../../services/analyticsService';

/**
 * 🎨 REDESIGNED VanishingGame - Kid-Friendly Theme
 * Keeps all logic, analytics, and backend connections
 * Only UI/UX is improved for children
 */
const VanishingGame = () => {
  // Game states: 'config', 'gameplay', 'feedback', 'complete', 'analytics'
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
  
  // Loading state for word generation
  const [loadingWords, setLoadingWords] = useState(false);
  const [wordGenerationError, setWordGenerationError] = useState(null);
  
  // 🎭 Character speech bubble - MASCOT INTERACTIONS!
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

  const [teamNames, setTeamNames] = useState({ teamA: 'Team A', teamB: 'Team B' });
  
  // Enhanced game statistics
  const [gameStats, setGameStats] = useState({
  wordsAttempted: 0,
  wordsRecognized: 0,
  wordsSkipped: 0,
  wordsShown: 0,
  averageResponseTime: 0,
  timeSpent: 0,
  streakCount: 0,
  maxStreak: 0,
  successRate: 0,
  patternStats: {}, // Make sure this exists
  difficultyProgression: [],
  totalWords: 0, // Add this
  correctWords: 0 // Add this
});

  /**
   * 🎮 Start game configuration
   */
  const handleStartGame = async (config) => {
  console.log('🚀 Starting game with config:', config);

  // 🔧 FIX: Reset ALL game state FIRST (before anything else)
  setCurrentRound(1);
  setScore(0);
  setCurrentWordIndex(0);
  setUsedWords([]);
  setLastResult(null);
  setWordData([]); // ← Clear old words immediately
  
  // 🔧 FIX: Reset gameStats COMPLETELY
  setGameStats({
    wordsAttempted: 0,
    wordsRecognized: 0,
    wordsSkipped: 0,
    wordsShown: 0,
    averageResponseTime: 0,
    timeSpent: 0,
    streakCount: 0,
    maxStreak: 0,
    successRate: 0,
    patternStats: {},
    difficultyProgression: [],
    totalWords: 0,
    correctWords: 0
  });
  
  // 🔧 FIX: Reset session timestamps
  setSessionStartTime(Date.now());
  setGameStartTime(Date.now());
  
  // NOW set the game configuration
  setGameConfig({
    ...config,
    enableAudio: config.enableAudio !== undefined ? config.enableAudio : true,
    voiceType: config.voiceType || 'happy'
  });
  setTotalRounds(config.numberOfQuestions || 10);
  setLoadingWords(true);
  setWordGenerationError(null);

  // Reset team state if team play
  if (config.teamPlay) {
    setTeamNames({
      teamA: config.teamAName || 'Team A',
      teamB: config.teamBName || 'Team B'
    });
    setTeamScores({ teamA: 0, teamB: 0 });
    setCurrentTeam('teamA');
  }
    
    try {
      // Generate words using AI service
      const generatedWords = await generateVanishingGameWords({
        challengeLevel: config.challengeLevel,
        learningFocus: config.learningFocus,
        difficulty: config.difficulty,
        wordCount: config.numberOfQuestions || 10
      });
      
      console.log('✅ Generated words:', generatedWords);
      
      if (generatedWords && generatedWords.length > 0) {
        setWordData(generatedWords);
        setCurrentWordIndex(0);
        setGameState('gameplay');
        setSessionStartTime(Date.now());
        setGameStartTime(Date.now());
        
        // 🎭 Mascot welcome message!
        setBubbleMessage('Let\'s learn some phonics! 🎉');
        setShowBubble(true);
        setTimeout(() => setShowBubble(false), 3000);
      } else {
        throw new Error('No words generated');
      }
    } catch (error) {
      console.error('❌ Error generating words:', error);
      setWordGenerationError('Failed to generate words. Please try again!');
    } finally {
      setLoadingWords(false);
    }
  };

  /**
   * 🎯 Handle word result from gameplay
   */
  const handleWordResult = (recognized, word, responseTime) => {
  console.log('🔍 handleWordResult:', { recognized, word, responseTime });
  
  const result = { recognized, word, responseTime };
  setLastResult(result);
  
  // ✅ Handle "I Know It" (correct answer)
  if (recognized === true) {
    console.log('✅ Correct answer!');
    
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

    // 🏆 Team score update
    if (gameConfig.teamPlay) {
      setTeamScores(prev => ({
        ...prev,
        [currentTeam]: prev[currentTeam] + 1
      }));
    }
    
    // 🎭 Mascot encouragement!
    if (gameConfig.teamPlay) {
      setBubbleMessage(`Excellent! Point for ${teamNames[currentTeam]}! 🎉`);
    } else {
      setBubbleMessage('Excellent! You got it right! 🎉✨');
    }
    setShowBubble(true);
    setTimeout(() => setShowBubble(false), 3000);
    
    setGameState('feedback');
  }
  
  // 👋 Handle "Give up"
  else if (recognized === 'giveup') {
    console.log('👋 Give up selected');
    
    const newStats = { ...gameStats };
    newStats.wordsAttempted++;
    newStats.timeSpent = Date.now() - sessionStartTime;
    newStats.streakCount = 0; // Reset streak
    
    const currentPattern = gameConfig.learningFocus;
    if (!newStats.patternStats[currentPattern]) {
      newStats.patternStats[currentPattern] = { attempted: 0, correct: 0, averageTime: 0 };
    }
    newStats.patternStats[currentPattern].attempted++;
    
    newStats.successRate = Math.round((newStats.wordsRecognized / newStats.wordsAttempted) * 100);
    
    newStats.difficultyProgression.push({
      round: currentRound,
      word: word,
      recognized: false,
      responseTime: responseTime || 0,
      pattern: currentPattern,
      action: 'gave_up'
    });
    
    setGameStats(newStats);
    
    // 🎭 Mascot encouragement for giving up
    setBubbleMessage('That\'s okay! Let\'s learn this word together! 💪');
    setShowBubble(true);
    setTimeout(() => setShowBubble(false), 3000);
    
    setGameState('feedback');
  }
  
  // 👀 Handle "Show me"
  else if (recognized === false) {
    console.log('👀 Show me pressed');
    
    const newStats = { ...gameStats };
    newStats.wordsAttempted++;
    newStats.wordsShown++;
    newStats.timeSpent = Date.now() - sessionStartTime;
    newStats.streakCount = 0; // Reset streak
    
    const currentPattern = gameConfig.learningFocus;
    if (!newStats.patternStats[currentPattern]) {
      newStats.patternStats[currentPattern] = { attempted: 0, correct: 0, averageTime: 0 };
    }
    newStats.patternStats[currentPattern].attempted++;
    
    newStats.successRate = Math.round((newStats.wordsRecognized / newStats.wordsAttempted) * 100);
    
    newStats.difficultyProgression.push({
      round: currentRound,
      word: word,
      recognized: false,
      responseTime: responseTime || 0,
      pattern: currentPattern,
      action: 'showed'
    });
    
    setGameStats(newStats);
    
    // 🎭 Mascot support message
    setBubbleMessage('Good job asking for help! Learning is great! 📚');
    setShowBubble(true);
    setTimeout(() => setShowBubble(false), 3000);
    
    setGameState('feedback');
  }
  
  // ⏭️ Handle "Skip" - doesn't count as a round
  else if (recognized === 'skip') {
    console.log('⏭️ Skip pressed');
    
    const newStats = { ...gameStats };
    newStats.wordsSkipped++;
    newStats.timeSpent = Date.now() - sessionStartTime;
    
    newStats.difficultyProgression.push({
      round: currentRound,
      word: word,
      recognized: false,
      responseTime: 0,
      pattern: gameConfig.learningFocus,
      action: 'skipped'
    });
    
    setGameStats(newStats);
    handleNextWord(false);
    return; // Skip exits early, no team switch
  }
  
  // 🎯 Team switching logic (runs for all actions except skip)
  if (gameConfig.teamPlay) {
    setCurrentTeam(prev => prev === 'teamA' ? 'teamB' : 'teamA');
  }
};

  /**
   * 📝 Handle next word
   */
  const handleNextWord = (countRound = true) => {
  console.log('➡️ Moving to next word', { countRound });
  
  if (currentRound >= totalRounds) {
    // Game complete!
    console.log('🎉 Game complete!');
    handleGameComplete();
  } else {
    // Move to next word
    if (countRound) {
      // Only increment round if countRound is true
      setCurrentRound(currentRound + 1);
    }
    setCurrentWordIndex(currentWordIndex + 1);
    setGameState('gameplay');
    setGameStartTime(Date.now());
  }
};

  /**
   * 🔄 Handle retry (try same word again)
   */
  const handleRetry = () => {
    console.log('🔄 Retrying word');
    setGameState('gameplay');
    setGameStartTime(Date.now());
  };

  /**
   * 🎊 Handle game complete
   */
  const handleGameComplete = async () => {
  console.log('🎊 Game completing...');
  
  const finalStats = {
    ...gameStats,
    timeSpent: Date.now() - sessionStartTime,
    // Ensure patternStats exists
    patternStats: gameStats.patternStats || {},
    difficultyProgression: gameStats.difficultyProgression || []
  };
  
  setGameStats(finalStats);
    
    // Save session to analytics
    try {
  // Prepare data for backend - ensure all fields exist
  const sessionData = {
    challengeLevel: gameConfig.challengeLevel || 'simple_words',
  learningFocus: gameConfig.learningFocus || 'short_vowels',
  difficulty: gameConfig.difficulty || 'easy',
  wordsAttempted: finalStats.wordsAttempted || 0,
  wordsRecognized: finalStats.wordsRecognized || 0,
  successRate: finalStats.successRate || 0,
  averageResponseTime: Math.round(finalStats.averageResponseTime || 0),
  maxStreak: finalStats.maxStreak || 0,
  timeSpent: Math.round(finalStats.timeSpent || 0),
  patternStats: finalStats.patternStats || {},
  wordList: wordData || [],
  teamPlay: gameConfig.teamPlay || false,
  teamScores: gameConfig.teamPlay ? teamScores : null,
  teamNames: gameConfig.teamPlay ? teamNames : null
  };
  
  console.log('📤 Sending session data:', sessionData);
  console.log('🔍 gameConfig:', gameConfig); // Debug log to see what's in gameConfig
  
  await phonicsAnalyticsService.saveGameSession(sessionData);
  console.log('✅ Analytics saved successfully');
} catch (error) {
  console.error('❌ Error saving analytics:', error);
  console.error('❌ Failed sessionData:', sessionData); // Log what we tried to send
  // Don't stop the game if analytics fail
}
    
    setGameState('complete');
  };

  /**
   * 🏠 Handle return to menu
   */
const handleReturnToMenu = () => {
  console.log('🏠 Returning to menu');
  
  // Reset all game state
  setGameState('config');
  setCurrentRound(1);
  setTotalRounds(10);
  setScore(0);
  setWordData([]);
  setCurrentWordIndex(0);
  setUsedWords([]);
  setLastResult(null);
  setClassEnergy(100); // ← Add this
  
  // 🔧 FIX: Reset team state
  setCurrentTeam('teamA');
  setTeamScores({ teamA: 0, teamB: 0 });
  
  // 🔧 FIX: Reset timestamps
  setSessionStartTime(Date.now());
  setGameStartTime(Date.now());
  
  // 🔧 FIX: Complete stats reset
  setGameStats({
    wordsAttempted: 0,
    wordsRecognized: 0,
    wordsSkipped: 0,
    wordsShown: 0,
    averageResponseTime: 0,
    timeSpent: 0,
    streakCount: 0,
    maxStreak: 0,
    successRate: 0,
    patternStats: {},
    difficultyProgression: [],
    totalWords: 0,      // ← Add this
    correctWords: 0     // ← Add this
  });
};

  /**
   * 📊 Handle view analytics
   */
  const handleViewAnalytics = () => {
    console.log('📊 Viewing analytics');
    setGameState('analytics');
  };

  /**
   * 🔙 Handle back from analytics
   */
  const handleBackFromAnalytics = () => {
    console.log('🔙 Back from analytics');
    setGameState('config');
  };

  /**
   * 🔄 Handle play again
   */
const handlePlayAgain = () => {
  // 🔧 FIX: Reset all game state
  setGameState('config');
  setCurrentRound(1);
  setTotalRounds(10);
  setScore(0);
  setCurrentWordIndex(0);
  setUsedWords([]);
  setLastResult(null);
  setClassEnergy(100);
  setWordData([]); // ← Add this to clear old words
  
  // Reset team state
  setCurrentTeam('teamA');
  setTeamScores({ teamA: 0, teamB: 0 });
  
  // 🔧 FIX: Reset session timestamps
  setSessionStartTime(Date.now());
  setGameStartTime(Date.now());
  
  // Reset stats completely
  setGameStats({
    wordsAttempted: 0,
    wordsRecognized: 0,
    wordsSkipped: 0,
    wordsShown: 0,
    averageResponseTime: 0,
    timeSpent: 0,
    streakCount: 0,
    maxStreak: 0,
    successRate: 0,
    patternStats: {},
    difficultyProgression: [],
    totalWords: 0,
    correctWords: 0
  });
};

  return (
    <div className={styles.vanishingGameContainer}>
      {/* 🎭 Mascot Character - ALWAYS VISIBLE! */}
      <AnimatePresence>
        {gameState !== 'config' && (
          <motion.div
            className={styles.mascotContainer}
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
          >
            <img 
              src={WildLitzFox} 
              alt="WildLitz Mascot" 
              className={styles.mascotImage}
            />
            
            {/* Speech Bubble */}
            <AnimatePresence>
              {showBubble && (
                <motion.div
                  className={styles.speechBubble}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', bounce: 0.6 }}
                >
                  {bubbleMessage}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Screens */}
      <AnimatePresence mode="wait">
        {gameState === 'config' && (
          <motion.div
            key="config"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <ConfigScreen 
              onStartGame={handleStartGame}
              onViewAnalytics={handleViewAnalytics}
              loading={loadingWords}
              error={wordGenerationError}
            />
          </motion.div>
        )}

        {gameState === 'gameplay' && wordData[currentWordIndex] && (
          <motion.div
            key={`gameplay-${currentRound}-${currentWordIndex}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <GameplayScreen
  wordData={wordData[currentWordIndex]}
  config={gameConfig}
  onResult={handleWordResult}
  round={currentRound}
  totalRounds={totalRounds}
  gameStats={gameStats}
  classEnergy={classEnergy}
  // ADD THESE TEAM PROPS:
  teamPlay={gameConfig.teamPlay || false}
  currentTeam={currentTeam}
  teamScores={teamScores}
  teamNames={teamNames}
/>
          </motion.div>
        )}

        {gameState === 'feedback' && wordData[currentWordIndex] && (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <FeedbackScreen
              wordData={wordData[currentWordIndex]}
              config={gameConfig}
              onNextWord={handleNextWord}
              onRetry={handleRetry}
              success={lastResult?.recognized === true}
            />
          </motion.div>
        )}

        {gameState === 'complete' && (
  <motion.div
    key="complete"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    style={{
      width: '100%',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}
  >
    {/* Fallback Complete Screen if GameCompleteScreen doesn't work */}
    {!GameCompleteScreen ? (
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '30px',
        textAlign: 'center',
        maxWidth: '600px'
      }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>🎉 Game Complete! 🎉</h1>
        <div style={{ fontSize: '2rem', marginBottom: '30px' }}>
          <p>Score: {gameStats.wordsRecognized} / {gameStats.wordsAttempted}</p>
          <p>Success Rate: {gameStats.successRate}%</p>
        </div>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <button 
            onClick={handlePlayAgain}
            style={{
              padding: '15px 30px',
              fontSize: '1.2rem',
              background: 'linear-gradient(135deg, #4CAF50, #81C784)',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              cursor: 'pointer'
            }}
          >
            🔄 Play Again
          </button>
          <button 
            onClick={handleReturnToMenu}
            style={{
              padding: '15px 30px',
              fontSize: '1.2rem',
              background: 'linear-gradient(135deg, #FF9800, #FFB74D)',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              cursor: 'pointer'
            }}
          >
            🏠 Menu
          </button>
          <button 
            onClick={handleViewAnalytics}
            style={{
              padding: '15px 30px',
              fontSize: '1.2rem',
              background: 'linear-gradient(135deg, #2196F3, #64B5F6)',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              cursor: 'pointer'
            }}
          >
            📊 Analytics
          </button>
        </div>
      </div>
    ) : (
      <GameCompleteScreen
  gameStats={gameStats}
  config={gameConfig}
  score={gameStats.wordsRecognized}
  totalWords={gameStats.wordsAttempted}
  onPlayAgain={handlePlayAgain}
  onReturnToMenu={handleReturnToMenu}
  onViewAnalytics={handleViewAnalytics}
  // ADD THESE TEAM PROPS:
  teamScores={teamScores}
  teamNames={teamNames}
/>
    )}
  </motion.div>
)}

        {gameState === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <GameAnalytics
              onBack={handleBackFromAnalytics}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VanishingGame;