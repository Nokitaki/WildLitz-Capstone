// src/pages/games/crossword/SummaryScreen.jsx
import React from 'react';
import { motion } from 'framer-motion';
import styles from '../../../styles/games/crossword/SummaryScreen.module.css';

/**
 * SummaryScreen component for the Crossword Game
 * Shows game statistics and words learned
 */
const SummaryScreen = ({ words, score, timeElapsed, solvedWords, totalWords, theme, onPlayAgain }) => {
  // Word emoji map for illustrations
  const getWordEmoji = (word) => {
    // In a real app, these would be mapped to appropriate images for each word
    // For now, use a simple mapping based on theme
    const themeEmojis = {
      animals: ['🐯', '🐵', '🦁', '🐘', '🦒', '🦊', '🐢', '🦓', '🐊'],
      space: ['🚀', '🛸', '🌍', '🌙', '☄️', '🌠', '🪐', '🌟'],
      sports: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎯'],
    };
    
    const emojis = themeEmojis[theme.toLowerCase()] || ['📚', '✏️', '🔤', '📝'];
    
    // Use consistent emoji for each word based on its first letter
    const charCode = word.answer.charCodeAt(0);
    return emojis[charCode % emojis.length];
  };
  
  // Calculate completion percentage
  const completionPercentage = Math.round((solvedWords / totalWords) * 100);
  
  // Format arrays of words for display
  const formatWordArray = (arr) => {
    if (arr.length <= 1) return arr.join('');
    if (arr.length === 2) return arr.join(' and ');
    
    const lastWord = arr[arr.length - 1];
    const restWords = arr.slice(0, -1).join(', ');
    return `${restWords}, and ${lastWord}`;
  };
  
  // Get word complexity ratings
  const getWordComplexity = (word) => {
    // In a real app, this would be based on grade level or reading level
    // For now, use word length as a proxy
    const length = word.answer.length;
    
    if (length <= 4) return 'Easy';
    if (length <= 6) return 'Medium';
    return 'Advanced';
  };
  
  return (
    <div className={styles.summaryContainer}>
      <div className={styles.summaryCard}>
        {/* Header */}
        <div className={styles.summaryHeader}>
          <div className={styles.themeInfo}>
            <span className={styles.themeLabel}>Theme: {theme}</span>
          </div>
          <div className={styles.themeInfo}>
            <span>Time: {timeElapsed}</span>
          </div>
        </div>
        
        {/* Completion message */}
        <div className={styles.completionMessage}>
          <h2 className={styles.messageTitle}>Crossword Puzzle Completed!</h2>
          <p className={styles.messageSubtitle}>
            You've successfully solved {solvedWords} out of {totalWords} words ({completionPercentage}%)
          </p>
        </div>
        
        {/* Words learned section */}
        <div className={styles.wordsLearnedSection}>
          <h3 className={styles.sectionTitle}>Words You've Learned:</h3>
          
          <div className={styles.wordCards}>
            {words.map((word, index) => (
              <div key={`summary-word-${index}`} className={styles.wordCard}>
                <div className={styles.wordHeader}>
                  <h4 className={styles.wordTitle}>{word.answer}</h4>
                  <div className={styles.wordImage}>{getWordEmoji(word)}</div>
                </div>
                
                <div className={styles.wordContent}>
                  <div className={styles.wordDefinition}>
                    <span className={styles.definitionLabel}>Definition: </span>
                    {word.definition || "A word you solved in the crossword puzzle."}
                  </div>
                  
                  <div className={styles.wordExample}>
                    <span className={styles.exampleLabel}>Example: </span>
                    {word.example || `The word "${word.answer}" was solved as part of the clue: "${word.clue}".`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Stats section */}
        <div className={styles.statsSection}>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>Score</div>
            <div className={styles.statValue}>{score}</div>
          </div>
          
          <div className={styles.statItem}>
            <div className={styles.statLabel}>Words Solved</div>
            <div className={styles.statValue}>{solvedWords}/{totalWords}</div>
          </div>
          
          <div className={styles.statItem}>
            <div className={styles.statLabel}>Completion</div>
            <div className={styles.statValue}>{completionPercentage}%</div>
          </div>
          
          <div className={styles.statItem}>
            <div className={styles.statLabel}>Time</div>
            <div className={styles.statValue}>{timeElapsed}</div>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className={styles.actionButtons}>
          <motion.button
            className={styles.playAgainButton}
            onClick={onPlayAgain}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Play Again
          </motion.button>
          
          <motion.button
            className={styles.mainMenuButton}
            onClick={onPlayAgain}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Main Menu
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default SummaryScreen;