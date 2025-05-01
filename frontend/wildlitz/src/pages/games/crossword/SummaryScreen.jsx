// src/pages/games/crossword/SummaryScreen.jsx
import React from 'react';
import { motion } from 'framer-motion';
import styles from '../../../styles/games/crossword/SummaryScreen.module.css';

/**
 * SummaryScreen component shows the words learned after completing the crossword puzzle
 */
const SummaryScreen = ({ 
  solvedWords, 
  timeSpent, 
  timeFormatted,
  theme, 
  onPlayAgain,
  onBuildSentences,
  onReturnToMenu,
  totalWords
}) => {
  // Get theme name with proper capitalization
  const themeName = theme.charAt(0).toUpperCase() + theme.slice(1);
  
  return (
    <div className={styles.summaryContainer}>
      <div className={styles.summaryCard}>
        {/* Header with theme info */}
        <div className={styles.summaryHeader}>
          <div className={styles.themeInfo}>
            <span className={styles.themeLabel}>Theme: {themeName}</span>
          </div>
        </div>
        
        {/* Completion message */}
        <motion.div 
          className={styles.completionMessage}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className={styles.messageTitle}>Great Job! You completed the puzzle!</h2>
          <p className={styles.messageSubtitle}>
            You learned {solvedWords.length} new {theme} words today
          </p>
        </motion.div>
        
        {/* Words learned section */}
        <div className={styles.wordsLearnedSection}>
          <h2 className={styles.sectionTitle}>Words You've Learned:</h2>
          <div className={styles.wordCards}>
            {solvedWords.map((word, index) => (
              <motion.div 
                key={index}
                className={styles.wordCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
              >
                <div className={styles.wordHeader}>
                  <h3 className={styles.wordTitle}>{word.word}</h3>
                </div>
                
                <div className={styles.wordContent}>
                  <div className={styles.wordDefinition}>
                    <span className={styles.definitionLabel}>Definition:</span> {word.definition}
                  </div>
                  
                  <div className={styles.wordExample}>
                    <span className={styles.exampleLabel}>Example:</span> 
                    {word.example.includes(word.word.toLowerCase()) ? (
                      <span>
                        {word.example.split(word.word.toLowerCase()).map((part, i, arr) => (
                          <React.Fragment key={i}>
                            {part}
                            {i < arr.length - 1 && <span className={styles.highlightedWord}>{word.word.toLowerCase()}</span>}
                          </React.Fragment>
                        ))}
                      </span>
                    ) : (
                      word.example
                    )}
                  </div>
                </div>
                
                {/* Word image placeholder - in a real app, images would be dynamically loaded */}
                <div className={styles.wordImage}>
                  {getWordImage(word.word, theme)}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Stats section */}
        <div className={styles.statsSection}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Words mastered:</span>
            <span className={styles.statValue}>{solvedWords.length}/{totalWords}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Time Spent:</span>
            <span className={styles.statValue}>{timeFormatted}</span>
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
            onClick={onReturnToMenu}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Main Menu
          </motion.button>
        </div>
        
        {/* Teacher controls */}
        <div className={styles.teacherControls}>
          <button className={styles.teacherButton} onClick={() => alert('Summary will be saved')}>Save Summary</button>
          <button className={styles.teacherButton} onClick={() => alert('Summary will be printed')}>Print Summary</button>
          <button className={styles.teacherButton} onClick={() => alert('Summary will be shared')}>Share with Class</button>
        </div>
      </div>
    </div>
  );
};

// Helper function to get a word image placeholder
// In a real app, this would load actual images based on the word and theme
const getWordImage = (word, theme) => {
  // Simple emoji placeholders based on theme and word
  const animalEmojis = {
    'TIGER': '🐯',
    'FROG': '🐸',
    'ELEPHANT': '🐘',
    'GIRAFFE': '🦒',
    'LION': '🦁',
    'MONKEY': '🐒',
    'ZEBRA': '🦓',
    'PENGUIN': '🐧',
    'TURTLE': '🐢',
    'WHALE': '🐳'
  };
  
  const spaceEmojis = {
    'PLANET': '🪐',
    'ROCKET': '🚀',
    'STAR': '⭐',
    'MOON': '🌙',
    'ALIEN': '👽',
    'GALAXY': '🌌',
    'ORBIT': '🛰️',
    'COMET': '☄️',
    'ASTRONAUT': '👨‍🚀',
    'UNIVERSE': '✨'
  };
  
  const sportsEmojis = {
    'SOCCER': '⚽',
    'BASEBALL': '⚾',
    'BASKETBALL': '🏀',
    'FOOTBALL': '🏈',
    'TENNIS': '🎾',
    'SWIMMING': '🏊',
    'RUNNING': '🏃',
    'CYCLING': '🚴',
    'GOLF': '🏌️',
    'VOLLEYBALL': '🏐'
  };
  
  // Select emoji based on theme
  let emojis = animalEmojis;
  if (theme === 'space') emojis = spaceEmojis;
  if (theme === 'sports') emojis = sportsEmojis;
  
  // Return emoji if available, otherwise a generic one
  return emojis[word.toUpperCase()] || '📚';
};

export default SummaryScreen;