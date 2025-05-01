// src/pages/games/vanishing/FeedbackScreen.jsx
import React from 'react';
import { motion } from 'framer-motion';
import styles from '../../../styles/games/vanishing/FeedbackScreen.module.css';

/**
 * FeedbackScreen component for the Vanishing Game
 * Shows feedback after a word attempt and explains the phonics pattern
 */
const FeedbackScreen = ({ wordData, config, onNextWord, onRetry, success }) => {
  // Destructure word data
  const { word, pattern, patternPosition, phonicsRule } = wordData;
  
  // Helper to render word with highlighted pattern
  const renderWordWithHighlight = () => {
    if (!pattern || pattern.length === 0) {
      return <span>{word}</span>;
    }
    
    const patternIndex = word.toLowerCase().indexOf(pattern.toLowerCase());
    
    if (patternIndex === -1) {
      return <span>{word}</span>;
    }
    
    const beforePattern = word.substring(0, patternIndex);
    const patternText = word.substring(patternIndex, patternIndex + pattern.length);
    const afterPattern = word.substring(patternIndex + pattern.length);
    
    return (
      <>
        <span>{beforePattern}</span>
        <span className={styles.highlightedPattern}>{patternText}</span>
        <span>{afterPattern}</span>
      </>
    );
  };
  
  // Get example words with the same pattern
  const getExampleWords = () => {
    // In a real app, this would come from a database or API
    // For now, provide some examples based on the pattern
    const examples = {
      'e': ['bed', 'pet', 'red', 'get', 'wet'],
      'a': ['cat', 'hat', 'bat', 'sat', 'rat'],
      'i': ['hit', 'sit', 'fit', 'big', 'pig'],
      'o': ['hot', 'pot', 'dot', 'top', 'hop'],
      'u': ['sun', 'run', 'fun', 'but', 'cup'],
      'sh': ['ship', 'shop', 'shut', 'fish', 'wish'],
      'ch': ['chip', 'chat', 'chin', 'rich', 'much'],
      'th': ['this', 'that', 'them', 'math', 'bath']
    };
    
    return examples[pattern] || [];
  };
  
  // Get a simple explanation of the phonics rule
  const getPhonicsExplanation = () => {
    // This would ideally come from a database with proper educational content
    const explanations = {
      'e': "The letter 'e' makes a short sound like in \"egg\"\nIt's different from the long \"me\"",
      'a': "The letter 'a' makes a short sound like in \"apple\"\nIt's different from the long \"ape\"",
      'i': "The letter 'i' makes a short sound like in \"igloo\"\nIt's different from the long \"ice\"",
      'o': "The letter 'o' makes a short sound like in \"ox\"\nIt's different from the long \"go\"",
      'u': "The letter 'u' makes a short sound like in \"up\"\nIt's different from the long \"cute\"",
      'sh': "The letters 'sh' together make a single sound\nLike the sound you make when asking someone to be quiet",
      'ch': "The letters 'ch' together make a single sound\nLike the sound at the beginning of \"cheese\"",
      'th': "The letters 'th' together make a single sound\nIt can sound soft like in \"this\" or hard like in \"think\""
    };
    
    return explanations[pattern] || "Focus on how this sound is pronounced in the word.";
  };
  
  // Track progress for this phonics pattern
  const getPatternProgress = () => {
    // In a real app, this would track actual progress
    // For this prototype, show a random progress
    return {
      current: success ? 3 : 2,
      total: 3
    };
  };
  
  const progressInfo = getPatternProgress();
  
  return (
    <div className={styles.feedbackContainer}>
      <div className={styles.feedbackCard}>
        {/* Success Animation */}
        {success && (
          <div className={styles.successAnimationContainer}>
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className={styles.confetti}
                style={{
                  backgroundColor: `hsl(${Math.random() * 360}, 80%, 60%)`,
                  top: `-20px`,
                  left: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, Math.random() * 300 + 200],
                  x: [0, Math.random() * 200 - 100],
                  rotate: [0, Math.random() * 360 * (Math.random() > 0.5 ? 1 : -1)],
                  opacity: [1, 0.5, 0],
                }}
                transition={{
                  duration: Math.random() * 2 + 1,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>
        )}
        
        {/* Feedback content */}
        <div className={styles.feedbackContent}>
          {/* Fox chat bubble with feedback */}
          <motion.div 
            className={styles.feedbackBubble}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {success ? "Great job!" : "Let's practice this word!"}
          </motion.div>
          
          {/* Word card */}
          <motion.div 
            className={styles.wordCardContainer}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className={styles.wordCard}>
              <div className={styles.wordText}>
                {renderWordWithHighlight()}
              </div>
            </div>
          </motion.div>
          
          {/* More examples and phonics rule */}
          <div className={styles.infoGrid}>
            <motion.div 
              className={styles.examplesSection}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <button className={styles.examplesButton}>
                More Examples
                <div className={styles.buttonIndicator}>
                  Show
                </div>
              </button>
            </motion.div>
            
            <motion.div 
              className={styles.phonicsRuleSection}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className={styles.phonicsRuleHeader}>
                <div className={styles.phonicsRuleTitle}>
                  Short '{pattern}' Sound
                </div>
              </div>
              <div className={styles.phonicsRuleContent}>
                {getPhonicsExplanation().split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </motion.div>
            
            <motion.div 
              className={styles.progressSection}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className={styles.progressTitle}>
                Pattern Progress
              </div>
              <div className={styles.progressValue}>
                {progressInfo.current}/{progressInfo.total}
              </div>
              <div className={styles.progressLabel}>
                Words Correct
              </div>
            </motion.div>
          </div>
          
          {/* Action buttons */}
          <div className={styles.actionButtons}>
            <motion.button 
              className={styles.tryAgainButton}
              onClick={onRetry}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.6 }}
            >
              Try Again
            </motion.button>
            
            <motion.button 
              className={styles.nextWordButton}
              onClick={onNextWord}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.7 }}
            >
              Next Word
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackScreen;