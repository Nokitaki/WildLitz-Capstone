// src/pages/games/vanishing/GameCompleteScreen.jsx
import React from 'react';
import { motion } from 'framer-motion';
import styles from '../../../styles/games/vanishing/GameCompleteScreen.module.css';

/**
 * GameCompleteScreen component shown at the end of a game session
 * Displays summary statistics and recommendations
 */
const GameCompleteScreen = ({ stats, config, score, totalWords, onPlayAgain, teamScores, teamNames }) => {
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
    
    if (stats.patternStats) {
      Object.entries(stats.patternStats).forEach(([pattern, data]) => {
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
    // In a real app, this would come from actual gameplay data
    // For now, return some sample words based on the learning focus
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
  
  // Get trophy icon based on score
  const getTrophyIcon = () => {
    if (successRate >= 90) return "🏆";
    if (successRate >= 70) return "🥇";
    if (successRate >= 50) return "🥈";
    return "🌟";
  };
  
  // Get trophy background color based on score
  const getTrophyBackground = () => {
    if (successRate >= 90) return "#FFD700";
    if (successRate >= 70) return "#4CAF50";
    if (successRate >= 50) return "#2196F3";
    return "#FF9800";
  };
  
  // Get stats color based on success rate
  const getStatsColor = (rate) => {
    if (rate >= 80) return "#4CAF50";
    if (rate >= 60) return "#8BC34A";
    if (rate >= 40) return "#FFC107";
    return "#FF9800";
  };
  
  // Get the pattern stats for display
  const patternStats = getPatternStats();
  
  // Get practice words
  const practiceWords = getPracticeWords();
  
  // Get recommendations
  const recommendations = getRecommendations();
  
  return (
    <div className={styles.completeContainer}>
      <div className={styles.completeCard}>
        {/* Confetti animation for celebration */}
        <div className={styles.confettiContainer}>
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className={styles.confettiPiece}
              style={{
                backgroundColor: `hsl(${Math.random() * 360}, 80%, 60%)`,
                width: `${Math.random() * 8 + 5}px`,
                height: `${Math.random() * 8 + 5}px`,
                top: `-20px`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, window.innerHeight],
                x: [0, Math.random() * 200 - 100],
                rotate: [0, Math.random() * 360 * (Math.random() > 0.5 ? 1 : -1)],
              }}
              transition={{
                duration: Math.random() * 2 + 2,
                ease: "linear",
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
        
        {/* Complete Header */}
        <div className={styles.completeHeader}>
          <h2 className={styles.completeTitle}>
            Game Complete
          </h2>
        </div>
        
      {/* Completion message */}
<div className={styles.completionMessage}>
  <motion.div 
    className={styles.messageBox}
    initial={{ scale: 0.9, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    <h3 className={styles.messageTitle}>Great work! Session Complete</h3>
    <p className={styles.messageText}>You practiced important phonics patterns today!</p>
  </motion.div>
</div>

{/* PUT THE TEAM RESULTS CODE HERE */}
{/* Team Results - Only show in team play mode */}
{config.teamPlay && teamResults && (
  <motion.div 
    className={styles.teamResultsSection}
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.5, delay: 0.3 }}
  >
    <div className={styles.teamResultsCard}>
      {teamResults.tie ? (
        <div className={styles.tieResult}>
          <div className={styles.tieIcon}>🤝</div>
          <h3>It's a Tie!</h3>
          <p>Both teams scored {teamResults.winnerScore} points!</p>
          <p>Great teamwork everyone! 🎉</p>
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
    </div>
  </motion.div>
)}
{/* END OF TEAM RESULTS CODE */}

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
                      pattern.pattern.includes('Digraph') ? '233, 30, 99' : '76, 175, 80'}, 0.15)`
                  }}
                >
                  <div className={styles.patternName}>{pattern.pattern}</div>
                  <div 
                    className={styles.patternRate}
                    style={{ color: getStatsColor(pattern.successRate) }}
                  >
                    {pattern.successRate}%
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
            <div className={styles.trophyContainer}>
              <motion.div 
                className={styles.trophyIcon}
                style={{ backgroundColor: getTrophyBackground() }}
                animate={{ 
                  scale: [1, 1.05, 1],
                  boxShadow: [
                    '0 0 0 0 rgba(255,255,255,0.5)',
                    '0 0 10px 5px rgba(255,255,255,0.7)',
                    '0 0 0 0 rgba(255,255,255,0.5)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {getTrophyIcon()}
              </motion.div>
              <div className={styles.achievementTitle}>
                {getAchievementTitle()}
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Words practiced section */}
        <motion.div 
          className={styles.wordsPracticedSection}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className={styles.sectionHeader}>
            Words You Practiced Today:
          </div>
          <div className={styles.wordsGrid}>
            {practiceWords.map((word, index) => (
              <div key={index} className={styles.wordChip}>
                {word}
              </div>
            ))}
            {practiceWords.length > 5 && (
              <div className={styles.wordChip}>...</div>
            )}
          </div>
        </motion.div>
        
        {/* Recommendations section */}
        <motion.div 
          className={styles.recommendationsSection}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className={styles.sectionHeader}>
            Recommended Next Steps:
          </div>
          <div className={styles.recommendationsList}>
            {recommendations.map((recommendation, index) => (
              <div key={index} className={styles.recommendationItem}>
                <span className={styles.recommendationBullet}>•</span>
                <span className={styles.recommendationText}>{recommendation}</span>
              </div>
            ))}
          </div>
        </motion.div>
        
        {/* Action buttons */}
        <motion.div 
          className={styles.actionButtons}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <motion.button 
            className={styles.summaryButton}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Print Summary
          </motion.button>
          
          <motion.button 
            className={styles.saveButton}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Save Results
          </motion.button>
          
          <motion.button 
            className={styles.exitButton}
            onClick={onPlayAgain}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Exit Game
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default GameCompleteScreen;