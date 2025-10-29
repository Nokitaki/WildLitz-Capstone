// src/pages/games/vanishing/GameCompleteScreen.jsx
import React from 'react';
import { motion } from 'framer-motion';
import styles from '../../../styles/games/vanishing/GameCompleteScreen.module.css';

/**
 * GameCompleteScreen component shown at the end of a game session
 * Displays summary statistics and recommendations
 */
const GameCompleteScreen = ({ 
  gameStats, 
  config, 
  score, 
  totalWords, 
  onPlayAgain, 
  onViewAnalytics, // ANALYTICS ADDED
  teamScores, 
  teamNames 
}) => {

   if (!gameStats) {
    return (
      <div style={{ 
        background: 'white', 
        padding: '40px', 
        borderRadius: '30px', 
        textAlign: 'center',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '20px' }}>⚠️ Game Complete</h2>
        <p style={{ marginBottom: '30px' }}>Unable to load game statistics.</p>
        <button 
          onClick={onReturnToMenu}
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
          🏠 Return to Menu
        </button>
      </div>
    );
  }
  // Add team winner logic
  const getTeamResults = () => {
    if (!config.teamPlay || !teamScores) return null;
    
    const teamAScore = teamScores.teamA || 0;
    const teamBScore = teamScores.teamB || 0;
    const teamAName = teamNames?.teamA || 'Team A';
    const teamBName = teamNames?.teamB || 'Team B';
    
    if (teamAScore > teamBScore) {
      return { winner: teamAName, loser: teamBName, winnerScore: teamAScore, loserScore: teamBScore, tie: false };
    } else if (teamBScore > teamAScore) {
      return { winner: teamBName, loser: teamAName, winnerScore: teamBScore, loserScore: teamAScore, tie: false };
    } else {
      return { winner: null, loser: null, winnerScore: teamAScore, loserScore: teamBScore, tie: true };
    }
  };
  
  const teamResults = getTeamResults();
  // Calculate success rate
  const successRate = Math.round((score / totalWords) * 100);
  
  // Get different pattern stats
  const getPatternStats = () => {
  const result = [];
  
  // Safety check - ensure gameStats and patternStats exist
  if (gameStats && gameStats.patternStats) {
    Object.entries(gameStats.patternStats).forEach(([pattern, data]) => {
        if (data.attempted > 0) {
          const successRate = Math.round((data.correct / data.attempted) * 100);
          result.push({
            pattern: formatPatternName(pattern),
            successRate,
            attempted: data.attempted,
            correct: data.correct
          });
        }
      });
    }
    
    return result;
  };
  
  // Format pattern name for display
  const formatPatternName = (pattern) => {
    return pattern.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Get recommendations based on performance
  const getRecommendations = () => {
    const recommendations = [];
    
    // Check if any patterns had low success rates
    const patternStats = getPatternStats();
    const lowPerformingPatterns = patternStats.filter(ps => ps.successRate < 70);
    
    if (lowPerformingPatterns.length > 0) {
      const patternNames = lowPerformingPatterns.map(p => p.pattern.toLowerCase()).join(', ');
      
      if (lowPerformingPatterns[0].pattern.toLowerCase().includes('digraph')) {
        recommendations.push(`Practice more with digraphs (sh, ch, th) - students found these challenging`);
      } else if (lowPerformingPatterns[0].pattern.toLowerCase().includes('blend')) {
        recommendations.push(`Continue working with consonant blends to build fluency`);
      } else {
        recommendations.push(`Focus more on ${patternNames} for additional practice`);
      }
    }
    
    // Add a recommendation based on the current focus
    if (config.learningFocus === 'short_vowels') {
      recommendations.push(`Try the "Sound Safari" game to focus on beginning consonant blends`);
    } else if (config.learningFocus === 'digraphs') {
      recommendations.push(`Practice with the Syllable Clapping game to reinforce syllable patterns`);
    }
    
    return recommendations.length > 0 ? recommendations : ["Great work! Try increasing the difficulty level for more challenge"];
  };
  
  // Get the practice words
  const getPracticeWords = () => {
    const words = {
      'short_vowels': ['cat', 'bed', 'fish', 'stop', 'jump'],
      'long_vowels': ['cake', 'meet', 'bike', 'rope', 'cube'],
      'blends': ['stop', 'frog', 'flag', 'swim', 'brush'],
      'digraphs': ['ship', 'chat', 'thin', 'shop', 'that']
    };
    
    return words[config.learningFocus] || ['cat', 'bed', 'fish', 'stop', 'jump'];
  };
  
  // Get achievement title based on score
  const getAchievementTitle = () => {
    if (successRate >= 90) return "Reading Champion!";
    if (successRate >= 70) return "Word Detective!";
    if (successRate >= 50) return "Reading Explorer!";
    return "Practice Makes Perfect!";
  };
  
  // Get achievement message
  const getAchievementMessage = () => {
    if (successRate >= 90) return "Outstanding! You're mastering phonics patterns!";
    if (successRate >= 70) return "Great job! You're making excellent progress!";
    if (successRate >= 50) return "Good work! Keep practicing to improve!";
    return "Every attempt helps you learn and grow!";
  };
  
  const patternStats = getPatternStats();
  const recommendations = getRecommendations();
  
  // Get color based on success rate
  const getStatsColor = (rate) => {
    if (rate >= 80) return '#4CAF50';
    if (rate >= 60) return '#FF9800';
    return '#E91E63';
  };
  
  return (
    <div className={styles.completeCard}>
      {/* Celebration Header */}
      <motion.div 
        className={styles.completeHeader}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
      >
        <div className={styles.celebrationIcon}>🎉</div>
        <h1 className={styles.completeTitle}>Game Complete!</h1>
        <div className={styles.messageBox}>
          <div className={styles.messageTitle}>{getAchievementTitle()}</div>
          <p className={styles.messageText}>{getAchievementMessage()}</p>
        </div>
      </motion.div>

      {/* Team Results (if team play) */}
      {teamResults && (
        <motion.div
          className={styles.teamResultsCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          {teamResults.tie ? (
            <div className={styles.tieResult}>
              <h3>It's a Tie!</h3>
              <div className={styles.tieScores}>
                <span>{teamResults.winnerScore} - {teamResults.loserScore}</span>
              </div>
              <p>Amazing teamwork from both teams! 🎉</p>
            </div>
          ) : (
            <div className={styles.winnerResult}>
              <div className={styles.winnerIcon}>🏆</div>
              <h3>{teamResults.winner} Wins!</h3>
              <div className={styles.finalScores}>
                <span className={styles.winnerScore}>{teamResults.winner}: {teamResults.winnerScore}</span>
                <span className={styles.loserScore}>{teamResults.loser}: {teamResults.loserScore}</span>
              </div>
              <p>Congratulations! Well played by both teams! 🎊</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Stats and recommendations area */}
      <div className={styles.completeContent}>
        {/* Left section - Game stats */}
        <motion.div 
          className={styles.statsSection}
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className={styles.sectionHeader}>
            Game Statistics
          </div>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>Words Attempted</div>
              <div className={styles.statValue}>{totalWords}</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>Words Recognized</div>
              <div className={styles.statValue}>{score}</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>Success Rate</div>
              <div 
                className={styles.statValue}
                style={{ color: getStatsColor(successRate) }}
              >
                {successRate}%
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Center section - Phonics patterns */}
        <motion.div 
          className={styles.patternsSection}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className={styles.sectionHeader}>
            Phonics Patterns Practiced
          </div>
          <div className={styles.patternsGrid}>
            {patternStats.map((pattern, index) => (
              <div 
                key={index} 
                className={styles.patternItem}
                style={{ 
                  backgroundColor: `rgba(${pattern.pattern.includes('Short') ? '255, 193, 7' : 
                    pattern.pattern.includes('Consonant') ? '33, 150, 243' : 
                    pattern.pattern.includes('Digraph') ? '156, 39, 176' : '76, 175, 80'}, 0.1)`,
                  borderColor: pattern.pattern.includes('Short') ? '#FFC107' : 
                    pattern.pattern.includes('Consonant') ? '#2196F3' : 
                    pattern.pattern.includes('Digraph') ? '#9C27B0' : '#4CAF50'
                }}
              >
                <div className={styles.patternName}>{pattern.pattern}</div>
                <div className={styles.patternRate}>
                  <span style={{ color: getStatsColor(pattern.successRate) }}>
                    {pattern.successRate}%
                  </span>
                </div>
                <div className={styles.patternAttempts}>
                  {pattern.correct}/{pattern.attempted} correct
                </div>
              </div>
            ))}
          </div>
        </motion.div>
        
        {/* Right section - Achievement */}
        <motion.div 
          className={styles.achievementSection}
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className={styles.sectionHeader}>
            Achievement
          </div>
          <motion.div 
            className={styles.trophyIcon}
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            {successRate >= 90 ? '🏆' : successRate >= 70 ? '🥈' : successRate >= 50 ? '🥉' : '⭐'}
          </motion.div>
          <div className={styles.achievementTitle}>{getAchievementTitle()}</div>
          <div className={styles.achievementScore}>{score}/{totalWords}</div>
        </motion.div>
      </div>

      {/* Recommendations Section */}
      <motion.div 
        className={styles.recommendationsSection}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className={styles.sectionHeader}>💡 Recommendations</div>
        <div className={styles.recommendationsList}>
          {recommendations.map((rec, index) => (
            <div key={index} className={styles.recommendationItem}>
              <span className={styles.recommendationIcon}>✓</span>
              <span className={styles.recommendationText}>{rec}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div 
        className={styles.actionButtons}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <button 
          className={styles.summaryButton}
          onClick={onPlayAgain}
        >
          🎮 Play Again
        </button>
        {/* ANALYTICS ADDED: View Analytics Button */}
        <button 
          className={styles.analyticsButton}
          onClick={onViewAnalytics}
        >
          📊 View Analytics
        </button>
        {/* END ANALYTICS ADDED */}
        <button 
          className={styles.exitButton}
          onClick={() => window.location.href = '/'}
        >
          🏠 Exit Game
        </button>
      </motion.div>
    </div>
  );
};

export default GameCompleteScreen;