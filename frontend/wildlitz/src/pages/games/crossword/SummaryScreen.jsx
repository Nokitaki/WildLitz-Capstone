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
  totalWords,
  isStoryMode = false,
  nextEpisodeAvailable = false,
  currentEpisode = 1,
  totalEpisodes = 0,
  hasNextEpisode = false,
  storyTitle = '',
  storySegment = null
}) => {

  // Get theme name with proper capitalization
  const themeName = theme === "story" ? "Story Adventure" : theme.charAt(0).toUpperCase() + theme.slice(1);
  
  const Confetti = () => {
    return (
      <div className={styles.confettiContainer}>
        {[...Array(20)].map((_, i) => (
          <div 
            key={i} 
            className={styles.confetti}
            style={{ 
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>
    );
  };

  // Helper function to get word image emoji
  const getWordImage = (word, theme) => {
    const emojiMap = {
      'explore': '🔍',
      'jungle': '🌴',
      'adventure': '🗺️',
      'discover': '💡',
      'brave': '🦁',
      'tree': '🌳',
      'red': '🔴',
      'run': '🏃',
      'small': '🐁',
      'blue': '🔵',
      'book': '📚',
      'find': '🔎',
      'help': '🤝',
      'map': '🗺️'
    };
    
    return emojiMap[word.toLowerCase()] || '⭐';
  };
  
  // Determine if next episode is available
  const shouldShowNextEpisode = nextEpisodeAvailable || hasNextEpisode || (currentEpisode < totalEpisodes);
  
  return (
    <div className={styles.summaryContainer}>
      <Confetti />
      <div className={styles.summaryCard}>
        {/* Header with theme info */}
        <div className={styles.summaryHeader}>
          <div className={styles.themeInfo}>
            <span className={styles.themeLabel}>
              {isStoryMode 
                ? `${storyTitle} - Episode ${currentEpisode}${totalEpisodes > 0 ? ` of ${totalEpisodes}` : ''}`
                : `Theme: ${themeName}`
              }
            </span>
          </div>
        </div>
        
        {/* Completion message */}
        <motion.div 
          className={styles.completionMessage}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
        >
          <h2 className={styles.messageTitle}>Great Job! You completed the puzzle!</h2>
          <p className={styles.messageSubtitle}>
            {isStoryMode 
              ? `You learned ${solvedWords.length} new words from the story!`
              : `You learned ${solvedWords.length} new ${theme} words today`
            }
          </p>
        </motion.div>
        
        {/* Story recap for story mode */}
        {isStoryMode && storySegment && (
          <div className={styles.storyRecap}>
            <h3 className={styles.recapTitle}>Story Recap:</h3>
            <p className={styles.recapText}>{storySegment.recap || storySegment.text.substring(0, 150) + '...'}</p>
            
            {storySegment.discussionQuestions && storySegment.discussionQuestions.length > 0 && (
              <div className={styles.recapQuestions}>
                <h4>Comprehension Check:</h4>
                <ul>
                  {storySegment.discussionQuestions.slice(0, 2).map((question, index) => (
                    <li key={index}>{question}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        {/* Words learned section */}
        <div className={styles.wordsLearnedSection}>
          <h2 className={styles.sectionTitle}>Words You've Learned:</h2>
          <div className={styles.wordCards}>
            {solvedWords.map((word, index) => (
              <motion.div 
                key={index}
                className={styles.wordCard}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: index * 0.15,
                  duration: 0.5,
                  type: "spring",
                  stiffness: 100 
                }}
              >
                <div className={styles.wordHeader}>
                  <h3 className={styles.wordTitle}>{word.word}</h3>
                  <div className={styles.wordImage}>
                    {getWordImage(word.word, theme)}
                  </div>
                </div>
                
                <div className={styles.wordContent}>
                  <div className={styles.wordDefinition}>
                    <span className={styles.definitionLabel}>Definition:</span> 
                    {word.definition || "An important word in our adventure story."}
                  </div>
                  
                  <div className={styles.wordExample}>
                    <span className={styles.exampleLabel}>Example:</span> 
                    {word.example || `The ${word.word} helps us on our adventure!`}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Story mode activities */}
        {isStoryMode && (
          <div className={styles.teacherSection}>
            <h3 className={styles.teacherTitle}>Teacher Activities:</h3>
            <div className={styles.activitiesList}>
              <div className={styles.activityItem}>
                <h4>Vocabulary Review</h4>
                <p>Ask students to use each word in their own sentence.</p>
              </div>
              <div className={styles.activityItem}>
                <h4>Story Prediction</h4>
                <p>Before continuing to the next episode, have students predict what might happen next in the story.</p>
              </div>
              <div className={styles.activityItem}>
                <h4>Character Discussion</h4>
                <p>Discuss how the characters felt during this episode and why they made certain choices.</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Action buttons */}
        <div className={styles.actionButtons}>
          <motion.button
            className={styles.playAgainButton}
            onClick={onPlayAgain}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isStoryMode 
              ? shouldShowNextEpisode 
                ? "▶️ Continue to Next Episode" 
                : "🏁 Finish Adventure"
              : "🔄 Play Again"
            }
          </motion.button>
          
          <motion.button
            className={styles.sentenceBuilderButton}
            onClick={onBuildSentences}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            📝 Build Sentences
          </motion.button>
          
          <motion.button
            className={styles.mainMenuButton}
            onClick={onReturnToMenu}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🏠 Main Menu
          </motion.button>
        </div>
        
        {/* Teacher controls */}
        <div className={styles.teacherControls}>
          <button 
            className={styles.teacherButton} 
            onClick={() => alert('Summary will be saved')}
          >
            💾 Save Summary
          </button>
          <button 
            className={styles.teacherButton} 
            onClick={() => alert('Summary will be printed')}
          >
            🖨️ Print Summary
          </button>
          <button 
            className={styles.teacherButton}
            onClick={() => alert('Shared with class')}
          >
            📤 Share with Class
          </button>
          <button 
            className={styles.teacherButton}
            onClick={() => alert('Reading assessment opened')}
          >
            📋 Reading Assessment
          </button>
        </div>
      </div>
    </div>
  );
};

export default SummaryScreen;