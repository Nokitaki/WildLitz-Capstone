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
  const { word, pattern, patternPosition, phonicsRule } = wordData;
  const [showExamples, setShowExamples] = useState(false);

  const [exampleWords, setExampleWords] = useState([]);
const [loadingExamples, setLoadingExamples] = useState(false);

  // Render word with highlighted pattern
  const renderWordWithHighlight = () => {
    if (!pattern || pattern.length === 0) {
      return <span className={styles.wordText}>{word}</span>;
    }
    
    const patternIndex = word.toLowerCase().indexOf(pattern.toLowerCase());
    
    if (patternIndex === -1) {
      return <span className={styles.wordText}>{word}</span>;
    }
    
    const beforePattern = word.substring(0, patternIndex);
    const patternText = word.substring(patternIndex, patternIndex + pattern.length);
    const afterPattern = word.substring(patternIndex + pattern.length);
    
    return (
      <span className={styles.wordText}>
        <span>{beforePattern}</span>
        <span className={styles.highlightedPattern}>{patternText}</span>
        <span>{afterPattern}</span>
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
  const getPhonicsExplanation = () => {
    const explanations = {
      'e': 'The letter "e" makes the /eh/ sound, like in "egg"',
      'a': 'The letter "a" makes the /ah/ sound, like in "apple"',
      'i': 'The letter "i" makes the /ih/ sound, like in "igloo"',
      'o': 'The letter "o" makes the /oh/ sound, like in "octopus"',
      'u': 'The letter "u" makes the /uh/ sound, like in "umbrella"',
      'sh': '"sh" makes the /sh/ sound, like in "shoe"',
      'ch': '"ch" makes the /ch/ sound, like in "cheese"',
      'th': '"th" makes the /th/ sound, like in "thumb"'
    };
    
    return explanations[pattern] || phonicsRule || `The pattern "${pattern}" is a special sound!`;
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