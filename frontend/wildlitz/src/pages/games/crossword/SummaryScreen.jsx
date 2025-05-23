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
  return (
    <div className={styles.summaryContainer}>

      <Confetti />
      <div className={styles.summaryCard}>
        {/* Header with theme info */}
        <div className={styles.summaryHeader}>
          <div className={styles.themeInfo}>
            <span className={styles.themeLabel}>
              {isStoryMode 
                ? `${storyTitle} - Episode ${currentEpisode}`
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
            
            <div className={styles.recapQuestions}>
              <h4>Comprehension Check:</h4>
              <ul>
                {storySegment.discussionQuestions && storySegment.discussionQuestions.slice(0, 2).map((question, index) => (
                  <li key={index}>{question}</li>
                ))}
              </ul>
            </div>
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
            {word.example && word.example.includes(word.word.toLowerCase()) ? (
              <span>
                {word.example.split(word.word.toLowerCase()).map((part, i, arr) => (
                  <React.Fragment key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <span className={styles.highlightedWord}>{word.word.toLowerCase()}</span>
                    )}
                  </React.Fragment>
                ))}
              </span>
            ) : (
              word.example || `The ${word.word.toLowerCase()} helps us on our adventure!`
            )}
          </div>
        </div>
        
        <motion.div 
          className={styles.wordBadge}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.15 + 0.3, duration: 0.5, type: "spring" }}
        >
          Mastered!
        </motion.div>
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
          {isStoryMode && (
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Episode:</span>
              <span className={styles.statValue}>{currentEpisode}</span>
            </div>
          )}
        </div>
        
        {/* Reading Extension Activities */}
        {isStoryMode && (
          <div className={styles.readingActivities}>
            <h3 className={styles.activitiesTitle}>Reading Extension Activities:</h3>
            <div className={styles.activitiesList}>
              <div className={styles.activityItem}>
                <h4>Vocabulary Review</h4>
                <p>Review the words as a class. Ask students to use each word in their own sentence.</p>
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
              ? nextEpisodeAvailable 
                ? "Continue to Next Episode" 
                : "Finish Adventure"
              : "Play Again"
            }
          </motion.button>
          
          <motion.button
            className={styles.sentenceBuilderButton}
            onClick={onBuildSentences}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Build Sentences
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
          <button 
            className={styles.teacherButton} 
            onClick={() => alert('Summary will be saved')}
          >
            Save Summary
          </button>
          <button 
            className={styles.teacherButton} 
            onClick={() => alert('Summary will be printed')}
          >
            Print Summary
          </button>
          <button 
            className={styles.teacherButton} 
            onClick={() => alert('Summary will be shared')}
          >
            Share with Class
          </button>
          {isStoryMode && (
            <button 
              className={styles.teacherButton} 
              onClick={() => alert('Student Reading Assessment will be generated')}
            >
              Reading Assessment
            </button>
          )}
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
  
  const storyEmojis = {
    'MAP': '🗺️',
    'PATH': '🛤️',
    'TREASURE': '💎',
    'COMPASS': '🧭',
    'JOURNEY': '🚶‍♂️',
    'JUNGLE': '🌴',
    'TIGER': '🐯',
    'STRIPES': '🎨',
    'ROAR': '🔊',
    'CAREFUL': '⚠️',
    'RIVER': '🌊',
    'BRIDGE': '🌉',
    'SYMBOLS': '🔣',
    'WEIGHT': '⚖️',
    'CLUE': '🔍',
    'ACADEMY': '🏛️',
    'PLANETS': '🪐',
    'MISSION': '🚀',
    'SAMPLES': '🧪',
    'SOLAR': '☀️'
  };
  
  // Select emoji based on theme
  let emojis = animalEmojis;
  if (theme === 'space') emojis = spaceEmojis;
  if (theme === 'sports') emojis = sportsEmojis;
  if (theme === 'story') emojis = storyEmojis;
  
  // Return emoji if available, otherwise a generic one
  return emojis[word.toUpperCase()] || '📚';
};

export default SummaryScreen;