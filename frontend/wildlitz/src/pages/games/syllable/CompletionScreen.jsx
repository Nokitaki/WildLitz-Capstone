import React from 'react';
import styles from '../../../styles/CompletionScreen.module.css';

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
    <div className={styles.container}>
      <div className={styles.confetti}></div>
      
      <div className={styles.completionCard}>
        <div className={styles.header}>
          <div className={styles.trophy}>🏆</div>
          <h1>Congratulations!</h1>
          <p>You've completed the Syllable Clapping Game</p>
        </div>
        
        <div className={styles.statsContainer}>
          <h2>Your Performance</h2>
          
          <div className={styles.statGrid}>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>Words Completed</div>
              <div className={styles.statValue}>{displayStats.totalWords}</div>
            </div>
            
            <div className={styles.statItem}>
              <div className={styles.statLabel}>Correct Answers</div>
              <div className={styles.statValue}>{displayStats.correctAnswers}</div>
            </div>
            
            <div className={styles.statItem}>
              <div className={styles.statLabel}>Accuracy</div>
              <div className={styles.statValue}>{displayStats.accuracy}</div>
            </div>
            
            <div className={styles.statItem}>
              <div className={styles.statLabel}>Difficulty</div>
              <div className={styles.statValue}>{displayStats.difficulty}</div>
            </div>
            
            <div className={styles.statItem}>
              <div className={styles.statLabel}>Completion Time</div>
              <div className={styles.statValue}>{displayStats.completionTime}</div>
            </div>
          </div>
        </div>
        
        <div className={styles.feedbackMessage}>
          <p>Great job breaking down words into syllables! Keep practicing to become a syllable master.</p>
        </div>
        
        <div className={styles.actionButtons}>
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
  );
};

export default CompletionScreen;