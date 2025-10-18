// src/pages/games/crossword/SummaryScreen.jsx
import React, { useEffect } from 'react'; // Update the React import to include useEffect
import { motion } from 'framer-motion';
import styles from '../../../styles/games/crossword/SummaryScreen.module.css';
import crosswordAnalyticsService from '../../../services/crosswordAnalyticsService';
import BackToHomeButton from '../crossword/BackToHomeButton';
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
  isStoryMode,
  nextEpisodeAvailable,
  hasNextEpisode,
  currentEpisode,
  totalEpisodes,
  storyTitle,
  storySegment,
  sessionId  // ADD THIS
}) => {

// REPLACE the entire useEffect in your SummaryScreen.jsx with this:

// FIXED SummaryScreen.jsx - Replace the useEffect with this

useEffect(() => {
  console.log('📊 ========== SUMMARY SCREEN MOUNTED ==========');
  console.log('🆔 SessionId:', sessionId);
  console.log('📝 Solved words:', solvedWords?.length || 0);
  console.log('📚 Current episode:', currentEpisode);
  console.log('📚 Total episodes:', totalEpisodes);
  console.log('⏱️ Time spent:', timeSpent);
  
  const logGameCompletion = async () => {
    // Check if we have a valid session ID
    if (!sessionId || sessionId === 'undefined' || sessionId === 'null') {
      console.error('❌ NO SESSION ID - Cannot log completion!');
      return;
    }

    // Check if we have solved words
    if (!solvedWords || solvedWords.length === 0) {
      console.warn('⚠️ No solved words, skipping completion log');
      return;
    }

    try {
      console.log('📤 ========== LOGGING EPISODE COMPLETION ==========');
      
      // ✅ FETCH SESSION ACTIVITIES TO CALCULATE TOTAL HINTS
      console.log('🔍 Fetching session activities to calculate total hints...');
      const sessionResponse = await fetch(
        `http://127.0.0.1:8000/api/sentence_formation/story/session/${sessionId}/`
      );
      
      let calculatedTotalHints = 0;
      
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        if (sessionData.success && sessionData.word_activities) {
          // Calculate total hints from all word activities
          calculatedTotalHints = sessionData.word_activities.reduce((total, activity) => {
            return total + (activity.hint_count || 0);
          }, 0);
          console.log(`✅ Calculated total hints from ${sessionData.word_activities.length} activities: ${calculatedTotalHints}`);
        }
      } else {
        console.warn('⚠️ Could not fetch session activities, using 0 for hints');
      }
      
      // Determine if this is the final episode
      const isFullyCompleted = currentEpisode >= totalEpisodes;
      
      const gameData = {
        totalTime: timeSpent || 0,
        totalHints: calculatedTotalHints,  // ✅ NOW USING CALCULATED VALUE!
        wordsLearned: solvedWords.length,
        accuracy: totalWords > 0 ? Math.round((solvedWords.length / totalWords) * 100) : 100,
        episodesCompleted: currentEpisode,
        isFullyCompleted: isFullyCompleted
      };

      console.log('📤 Sending game data:', JSON.stringify(gameData, null, 2));
      console.log('🎯 Target session:', sessionId);
      console.log('📚 Vocabulary words:', solvedWords.map(w => w.word || w));
      console.log(`💡 Total hints calculated: ${calculatedTotalHints}`);

      // Log game completion with calculated hints
      const result = await crosswordAnalyticsService.logGameCompleted(
        sessionId, 
        gameData,
        solvedWords
      );
      
      console.log('✅ ========== EPISODE COMPLETION LOGGED ==========');
      console.log(`✅ Episode ${currentEpisode} of ${totalEpisodes} recorded`);
      console.log(`✅ Total hints logged: ${calculatedTotalHints}`);
      console.log('✅ Result:', result);
      
      if (isFullyCompleted) {
        console.log('🎉 ========== ALL EPISODES COMPLETED ==========');
        console.log('🎉 Session marked as complete!');
      }
    } catch (error) {
      console.error('❌ ========== ANALYTICS LOGGING FAILED ==========');
      console.error('❌ Error:', error);
    }
  };

  // Always try to log, even if no solved words (for debugging)
  logGameCompletion();
  
}, []); // Empty dependency array - run once on mount

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
         <BackToHomeButton position="top-right" />
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
  {/* Show "Next Episode" button if there are more episodes */}
  {hasNextEpisode && currentEpisode < totalEpisodes ? (
    <motion.button
      className={styles.playAgainButton}
      onClick={onPlayAgain}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      Continue to Episode {currentEpisode + 1}
    </motion.button>
  ) : (
    <motion.button
      className={styles.playAgainButton}
      onClick={onReturnToMenu}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      Create New Story
    </motion.button>
  )}
  
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

{/* Episode progress indicator (optional but helpful) */}
{isStoryMode && totalEpisodes > 1 && (
  <div className={styles.episodeProgress}>
    <p>Episode {currentEpisode} of {totalEpisodes} completed!</p>
    {hasNextEpisode && (
      <p className={styles.nextEpisodeText}>
        🎉 More adventure awaits in the next episode!
      </p>
    )}
  </div>
)}
        
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