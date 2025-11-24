import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../../styles/games/vanishing/FeedbackScreen.module.css';
import SoundButton from './SoundButton';
import axios from 'axios';
import { API_ENDPOINTS } from '../../../config/api';

/**
 * 🎨 REDESIGNED FeedbackScreen for Kids
 * Colorful, engaging, and educational feedback after each word
 */
const FeedbackScreen = ({ wordData, config, onNextWord, onRetry, success }) => {
  const { word, pattern, patternPosition, phonicsRule, targetLetter } = wordData;
  const [showExamples, setShowExamples] = useState(false);

  const [exampleWords, setExampleWords] = useState([]);
const [loadingExamples, setLoadingExamples] = useState(false);

  const isCharPartOfPattern = (charIndex, text, searchPattern) => {
    if (!searchPattern || !text || searchPattern.length === 0) return false;
    
    const lowerText = text.toLowerCase();
    const lowerPattern = searchPattern.toLowerCase();
    
    // Remove prefixes to get actual pattern
    const cleanPattern = lowerPattern
      .replace(/^short_/, '')
      .replace(/^long_/, '')
      .replace(/^blend_/, '')
      .replace(/^digraph_/, '');
    
    // Check if character at charIndex is part of the pattern
    for (let i = 0; i < cleanPattern.length; i++) {
      const patternStartIndex = charIndex - i;
      if (patternStartIndex >= 0 && patternStartIndex + cleanPattern.length <= text.length) {
        const substring = lowerText.substring(patternStartIndex, patternStartIndex + cleanPattern.length);
        if (substring === cleanPattern) {
          // This character is part of the pattern
          return true;
        }
      }
    }
    
    return false;
  };


  // Render word with highlighted pattern
// NEW VERSION - Finds ALL patterns
const renderWordWithHighlight = () => {
  // Extract targetLetter from wordData
  const targetLetter = wordData.targetLetter || pattern;
  
  if (!targetLetter || targetLetter.length === 0 || !word) {
    return <span className={styles.wordText}>{word}</span>;
  }
  
  // Remove any prefixes to get the actual pattern to search for
  const cleanPattern = targetLetter
    .replace(/^short_/, '')
    .replace(/^long_/, '')
    .replace(/^blend_/, '')
    .replace(/^digraph_/, '')
    .replace(/^vowel_team_/, '');
  
  // ============================================
  // SPECIAL HANDLING: Magic-e patterns (a_e, i_e, o_e, u_e, e_e)
  // ============================================
  if (cleanPattern.includes('_')) {
    const [vowel, e] = cleanPattern.split('_');
    const characters = word.split('');
    const lowerWord = word.toLowerCase();
    
    return (
      <span className={styles.wordText}>
        {characters.map((char, index) => {
          let shouldHighlight = false;
          
          // Look for: vowel + any consonant + 'e'
          // Example: "fire" has 'i' at index 1, 'r' at index 2, 'e' at index 3
          for (let i = 0; i < lowerWord.length - 2; i++) {
            if (lowerWord[i] === vowel && 
                lowerWord[i + 2] === e && 
                lowerWord[i + 1] !== ' ') {
              // Underline both the vowel AND the silent e
              if (index === i || index === i + 2) {
                shouldHighlight = true;
                break;
              }
            }
          }
          
          return shouldHighlight ? (
            <span key={index} className={styles.highlightedPattern}>
              {char}
            </span>
          ) : (
            <span key={index}>{char}</span>
          );
        })}
      </span>
    );
  }
  
  // ============================================
  // REGULAR PATTERNS: Consecutive letters (blends, digraphs, vowel teams)
  // ============================================
  const characters = word.split('');
  const lowerWord = word.toLowerCase();
  const lowerPattern = cleanPattern.toLowerCase();
  
  const isPartOfPattern = (index) => {
    for (let i = 0; i < lowerPattern.length; i++) {
      const patternStartIndex = index - i;
      if (patternStartIndex >= 0 && patternStartIndex + lowerPattern.length <= word.length) {
        const substring = lowerWord.substring(patternStartIndex, patternStartIndex + lowerPattern.length);
        if (substring === lowerPattern) {
          return true;
        }
      }
    }
    return false;
  };
  
  return (
    <span className={styles.wordText}>
      {characters.map((char, index) => {
        const shouldHighlight = isPartOfPattern(index);
        
        return shouldHighlight ? (
          <span key={index} className={styles.highlightedPattern}>
            {char}
          </span>
        ) : (
          <span key={index}>{char}</span>
        );
      })}
    </span>
  );
};

  useEffect(() => {
  loadExampleWords();
}, [pattern]);

const loadExampleWords = async () => {
  setLoadingExamples(true);
  try {
    const response = await axios.post(
      `${API_ENDPOINTS.PHONICS}/generate-example-words/`,
      {
        pattern: pattern,
        challengeLevel: config.challengeLevel, 
        learningFocus: config.learningFocus,    
        count: 5
      }
    );
    
    if (response.data.success) {
      setExampleWords(response.data.examples);
    }
  } catch (error) {
    console.error('Error loading examples:', error);
    // Fallback to static examples
    setExampleWords(getStaticExamples());
  } finally {
    setLoadingExamples(false);
  }
};

// Keep static examples as fallback
const getStaticExamples = () => {
  const examples = {
    'short_a': ['cat', 'hat', 'bat', 'sat', 'mat'],
    'short_e': ['bed', 'pet', 'red', 'get', 'wet'],
    'short_i': ['hit', 'sit', 'fit', 'big', 'pig'],
    'short_o': ['hot', 'pot', 'dot', 'top', 'hop'],
    'short_u': ['sun', 'run', 'fun', 'but', 'cup']
  };
  return examples[pattern] || ['example1', 'example2', 'example3'];
};

  // Get example words
  const getExampleWords = () => {
    const examples = {
      'e': ['bed', 'pet', 'red', 'get', 'wet'],
      'a': ['cat', 'hat', 'bat', 'sat', 'mat'],
      'i': ['hit', 'sit', 'fit', 'big', 'pig'],
      'o': ['hot', 'pot', 'dot', 'top', 'hop'],
      'u': ['sun', 'run', 'fun', 'but', 'cup'],
      'sh': ['ship', 'shop', 'shut', 'fish', 'wish'],
      'ch': ['chip', 'chat', 'chin', 'rich', 'much'],
      'th': ['this', 'that', 'them', 'math', 'bath'],
      'ay': ['play', 'day', 'say', 'way', 'stay'],
      'ee': ['tree', 'bee', 'see', 'free', 'three']
    };
    
    return examples[pattern] || ['example1', 'example2', 'example3'];
  };

  // Get phonics explanation
 // Get phonics explanation based on learning focus (not specific pattern)
const getPhonicsExplanation = () => {
  // Just use the phonicsRule from AI - it has explanations for ALL patterns!
  return phonicsRule || `The pattern "${pattern}" is a special sound!`;
};

  return (
    <div className={styles.feedbackContainer}>
      {/* Background Elements */}
      <div className={styles.backgroundElements}>
        <div className={styles.floatingBubble} style={{ top: '10%', left: '5%' }}>🎈</div>
        <div className={styles.floatingBubble} style={{ top: '15%', right: '8%' }}>🎈</div>
        <div className={styles.floatingConfetti} style={{ top: '70%', left: '10%' }}>🎉</div>
        <div className={styles.floatingConfetti} style={{ top: '65%', right: '12%' }}>🎊</div>
      </div>

      {/* Result Banner */}
      <motion.div
        className={`${styles.resultBanner} ${success ? styles.successBanner : styles.tryAgainBanner}`}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', bounce: 0.6 }}
      >
        <div className={styles.bannerEmoji}>
          {success ? '🌟' : '💪'}
        </div>
        <div className={styles.bannerText}>
          {success ? 'Awesome Job!' : 'Keep Trying!'}
        </div>
        <div className={styles.bannerSubtext}>
          {success ? 'You got it right!' : 'You\'re doing great!'}
        </div>
      </motion.div>

      {/* Word Display Card */}
      <motion.div
        className={styles.wordCard}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
      >
        <div className={styles.wordCardHeader}>
          <span className={styles.headerEmoji}>📖</span>
          <h2 className={styles.headerTitle}>The Word Was:</h2>
        </div>
        
        <div className={styles.wordDisplay}>
  {renderWordWithHighlight()}
  
  {/* 🔊 Sound Button */}
  <SoundButton 
    text={word}
    voiceType="friendly"
    size="large"
  />
</div>

        {pattern && (
          <div className={styles.patternInfo}>
            <span className={styles.patternLabel}>Pattern:</span>
            <span className={styles.patternValue}>{pattern}</span>
          </div>
        )}
      </motion.div>

      {/* Learning Section */}
      <motion.div
        className={styles.learningSection}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, type: 'spring', bounce: 0.5 }}
      >
        <div className={styles.learningSectionHeader}>
          <span className={styles.learningEmoji}>🎯</span>
          <h3 className={styles.learningTitle}>What You Learned</h3>
        </div>

        <div className={styles.phonicsExplanation}>
          <p className={styles.explanationText}>{getPhonicsExplanation()}</p>
        </div>

        {/* Examples Toggle */}
        <motion.button
          className={styles.examplesToggle}
          onClick={() => setShowExamples(!showExamples)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className={styles.toggleEmoji}>
            {showExamples ? '👆' : '👇'}
          </span>
          <span className={styles.toggleText}>
            {showExamples ? 'Hide' : 'Show'} More Examples
          </span>
        </motion.button>

        {/* Examples List */}
        <AnimatePresence>
          {showExamples && (
            <motion.div
              className={styles.examplesList}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className={styles.examplesGrid}>
  {loadingExamples ? (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <div className={styles.spinner}></div>
      <p>Generating examples...</p>
    </div>
  ) : (
    exampleWords.map((example, index) => (
      <motion.div
        key={index}
        className={styles.exampleWord}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: index * 0.1, type: 'spring', bounce: 0.5 }}
      >
        {example}
      </motion.div>
    ))
  )}
</div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        className={styles.actionButtons}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, type: 'spring', bounce: 0.5 }}
      >
        {!success && (
          <motion.button
            className={`${styles.actionButton} ${styles.retryButton}`}
            onClick={onRetry}
            whileHover={{ scale: 1.05, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className={styles.buttonEmoji}>🔄</span>
            <span className={styles.buttonText}>Try Again</span>
          </motion.button>
        )}

        <motion.button
          className={`${styles.actionButton} ${styles.nextButton}`}
          onClick={onNextWord}
          whileHover={{ scale: 1.05, rotate: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className={styles.buttonEmoji}>➡️</span>
          <span className={styles.buttonText}>Next Word</span>
        </motion.button>
      </motion.div>

      {/* Motivational Messages */}
      <motion.div
        className={styles.motivationalMessage}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <span className={styles.messageEmoji}>✨</span>
        <p className={styles.messageText}>
          {success 
            ? "You're a phonics superstar! Keep it up!" 
            : "Every mistake helps you learn! You're getting better!"}
        </p>
      </motion.div>
    </div>
  );
};

export default FeedbackScreen;