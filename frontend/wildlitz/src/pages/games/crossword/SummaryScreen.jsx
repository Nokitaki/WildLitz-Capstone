// SummaryScreen.jsx - Optimized & Performance-Enhanced Version
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import styles from '../../../styles/games/crossword/SummaryScreen.module.css';
import crosswordAnalyticsService from '../../../services/crosswordAnalyticsService';

const SummaryScreen = ({ 
  solvedWords = [], 
  isStoryMode = false,
  storySegment = null,
  currentEpisode = 1,
  totalEpisodes = 1,
  hasNextEpisode = false,
  onPlayAgain,
  onReturnToMenu,
  theme = "adventure",
  sessionId,
  timeSpent = 0,
  totalWords = 0,
  totalHints = 0
}) => {

  // State management
  const [selectedWord, setSelectedWord] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Calculate basic metrics only
  const performanceMetrics = useMemo(() => {
    const wordsCount = solvedWords.length;
    const episodeProgress = Math.round((currentEpisode / totalEpisodes) * 100);
    
    return {
      wordsCount,
      episodeProgress
    };
  }, [solvedWords.length, currentEpisode, totalEpisodes]);

  // Analytics logging
  useEffect(() => {
  const logAnalytics = async () => {
    if (!sessionId) {
      console.log('⚠️ No session ID available for analytics logging');
      return;
    }

    try {
      console.log('📊 SummaryScreen - Logging analytics');
      console.log('  - Session ID:', sessionId);
      console.log('  - Total Hints:', totalHints);
      console.log('  - Words solved:', solvedWords.length);
      console.log('  - Time spent:', timeSpent);

      const gameData = {
        wordsLearned: solvedWords.length,
        totalTime: timeSpent,
        totalHints: totalHints,  // ✅ CRITICAL: Make sure this matches the prop name
        episodesCompleted: currentEpisode,
        accuracy: Math.round((solvedWords.length / totalWords) * 100),
        isFullyCompleted: !hasNextEpisode
      };

      console.log('📊 Game data object:', JSON.stringify(gameData, null, 2));

      // ✅ Pass totalHints as both part of gameData AND as separate parameter
      await crosswordAnalyticsService.logGameCompleted(
        sessionId,
        gameData,
        solvedWords,
        totalHints  // ✅ PASS AS SEPARATE PARAMETER TOO
      );

      console.log('✅ Analytics logged successfully');
    } catch (error) {
      console.error('❌ Failed to log analytics:', error);
    }
  };

  logAnalytics();
}, [sessionId, solvedWords.length, totalHints, timeSpent]); // ✅ Include totalHints in dependencies

  // Word emoji mapping
  const getWordEmoji = (word) => {
    const emojiMap = {
      'adventure': '🗺️', 'explore': '🔍', 'brave': '🦁', 'mystery': '🔮',
      'treasure': '💎', 'journey': '🚶', 'discover': '⭐', 'friend': '🤝',
      'help': '🤲', 'run': '🏃', 'jump': '🦘', 'find': '🔎',
      'look': '👀', 'walk': '🚶', 'play': '🎮', 'learn': '📚',
      'read': '📖', 'write': '✍️', 'think': '🧠', 'solve': '🧩'
    };
    return emojiMap[word.toLowerCase()] || '✨';
  };

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Simple achievement cards - fewer metrics
  const achievements = [
    { 
      icon: "📚", 
      title: "Words Learned", 
      value: performanceMetrics.wordsCount,
      color: "#9333ea"
    },
    { 
      icon: "⏱️", 
      title: "Time", 
      value: formatTime(timeSpent),
      color: "#2563eb"
    },
    { 
      icon: "💡", 
      title: "Hints", 
      value: totalHints,
      color: "#f59e0b"
    }
  ];

  return (
    <div className={styles.summaryContainer}>
      {/* ===== CELEBRATION HEADER ===== */}
      <div className={styles.celebrationHeader}>
        <div className={styles.trophyIcon}>🏆</div>
        <h1 className={styles.celebrationTitle}>
          {hasNextEpisode ? "Episode Complete!" : "Mission Accomplished!"}
        </h1>
        <p className={styles.celebrationSubtitle}>
          Great job! Keep learning and growing! 🌟
        </p>
        
        {/* Episode Progress Bar */}
        <div className={styles.episodeProgressContainer}>
          <div className={styles.episodeProgressLabel}>
            <span>Story Progress</span>
            <span className={styles.episodeCount}>
              Episode {currentEpisode} of {totalEpisodes}
            </span>
          </div>
          <div className={styles.progressBarContainer}>
            <div 
              className={styles.progressBarFill}
              style={{ width: `${performanceMetrics.episodeProgress}%` }}
            >
              <span className={styles.progressPercentage}>
                {performanceMetrics.episodeProgress}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== PERFORMANCE DASHBOARD ===== */}
      <div className={styles.performanceSection}>
        <h2 className={styles.sectionTitle}>📊 Your Learning Stats</h2>
        
        <div className={styles.achievementsGrid}>
          {achievements.map((achievement, index) => (
            <div
              key={index}
              className={styles.achievementBadge}
              style={{ borderColor: achievement.color }}
            >
              <div className={styles.achievementIcon}>
                {achievement.icon}
              </div>
              <div className={styles.achievementValue} style={{ color: achievement.color }}>
                {achievement.value}
              </div>
              <div className={styles.achievementTitle}>{achievement.title}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== VOCABULARY SHOWCASE ===== */}
      <div className={styles.superWordsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            ✨ Your New Super Words!
          </h2>
          <button 
            className={styles.toggleDetailsBtn}
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? '📝 Hide Details' : '📖 Show Definitions'}
          </button>
        </div>

        <div className={styles.wordsGrid}>
          {solvedWords.map((wordData, index) => {
            const word = typeof wordData === 'string' ? wordData : wordData.word;
            const definition = wordData.definition || "A valuable word you've learned!";
            
            return (
              <div
                key={index}
                className={`${styles.wordCard} ${selectedWord === word ? styles.selectedCard : ''}`}
                onClick={() => setSelectedWord(selectedWord === word ? null : word)}
              >
                <div className={styles.wordCardHeader}>
                  <div className={styles.wordEmoji}>
                    {getWordEmoji(word)}
                  </div>
                  <div className={styles.wordNumber}>#{index + 1}</div>
                </div>

                <div className={styles.wordInfo}>
                  <h3 className={styles.wordTitle}>{word}</h3>
                  
                  {(showDetails || selectedWord === word) && (
                    <div className={styles.wordDefinitionContainer}>
                      <p className={styles.wordDefinition}>
                        {definition}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== ACTION BUTTONS ===== */}
      <div className={styles.actionButtonsContainer}>
        {hasNextEpisode ? (
          <button
            onClick={onPlayAgain}
            className={styles.nextEpisodeButton}
          >
            <span className={styles.buttonIcon}>▶️</span>
            Continue to Episode {currentEpisode + 1}!
          </button>
        ) : (
          <button
            onClick={onPlayAgain}
            className={styles.playAgainButton}
          >
            <span className={styles.buttonIcon}>🔄</span>
            Play Another Adventure
          </button>
        )}
        
        <button
          onClick={onReturnToMenu}
          className={styles.mainMenuButton}
        >
          <span className={styles.buttonIcon}>🏠</span>
          Return to Main Menu
        </button>
      </div>

      
    </div>
  );
};

export default SummaryScreen;