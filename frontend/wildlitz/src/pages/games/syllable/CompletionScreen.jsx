// src/pages/games/syllable/CompletionScreen.jsx <current update > 2025-04-21 9:30:00>
import React from 'react';
import styles from '../../../styles/games/syllable/CompletionScreen.module.css';

const CompletionScreen = ({ stats, onPlayAgain, onGoHome }) => {
  // Sample stats for design purposes
  const sampleStats = {
    totalWords: 10,
    correctAnswers: 8,
    accuracy: '80%',
    difficulty: 'Medium',
    completionTime: '3:45'
  };
  
  const displayStats = stats || sampleStats;
  
  return (
    <div className={styles.completionContainer}>
      <div className={styles.confettiWrapper}>
        <div className={styles.confetti}></div>
      </div>
      
      <div className={styles.completionContentWrapper}>
        <div className={styles.completionCard}>
          {/* Trophy and header */}
          <div className={styles.completionHeader}>
            <div className={styles.trophyContainer}>
              <div className={styles.trophy}>🏆</div>
            </div>
            <h1>Congratulations!</h1>
            <p>You've completed the Syllable Clapping Game</p>
          </div>
          
          {/* Stats Section */}
          <div className={styles.statsSection}>
            <h2>Your Performance</h2>
            
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <div className={styles.statIcon}>📚</div>
                <div className={styles.statLabel}>Words Completed</div>
                <div className={styles.statValue}>{displayStats.totalWords}</div>
              </div>
              
              <div className={styles.statItem}>
                <div className={styles.statIcon}>✅</div>
                <div className={styles.statLabel}>Correct Answers</div>
                <div className={styles.statValue}>{displayStats.correctAnswers}</div>
              </div>
              
              <div className={styles.statItem}>
                <div className={styles.statIcon}>🎯</div>
                <div className={styles.statLabel}>Accuracy</div>
                <div className={styles.statValue}>{displayStats.accuracy}</div>
              </div>
              
              <div className={styles.statItem}>
                <div className={styles.statIcon}>⭐</div>
                <div className={styles.statLabel}>Difficulty</div>
                <div className={styles.statValue}>{displayStats.difficulty}</div>
              </div>
              
              <div className={styles.statItem}>
                <div className={styles.statIcon}>⏱️</div>
                <div className={styles.statLabel}>Time</div>
                <div className={styles.statValue}>{displayStats.completionTime}</div>
              </div>
            </div>
          </div>
          
          {/* Feedback Section */}
          <div className={styles.feedbackSection}>
            <div className={styles.feedbackBubble}>
              <p>Great job breaking down words into syllables! Keep practicing to become a syllable master.</p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className={styles.actionButtonsContainer}>
            <button 
              className={styles.homeButton}
              onClick={onGoHome}
            >
              Go to Home
            </button>
            
            <button 
              className={styles.playAgainButton}
              onClick={onPlayAgain}
            >
              Play Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompletionScreen;