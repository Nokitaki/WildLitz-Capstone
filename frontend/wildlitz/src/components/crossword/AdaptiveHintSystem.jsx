// src/components/AdaptiveHintSystem.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../styles/components/AdaptiveHintSystem.module.css';

const AdaptiveHintSystem = ({
  word,
  definition,
  clue,
  storyContext,
  previousHints = [],
  attemptCount = 0,
  onClose,
  onUseHint
}) => {
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hints, setHints] = useState([]);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [availableHints, setAvailableHints] = useState(3);
  
  // Fetch adaptive hints when component mounts
  useEffect(() => {
    if (word && availableHints > 0) {
      generateHints();
    }
  }, [word]);
  
  // Generate adaptive hints based on word and context
  const generateHints = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/generate-hint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          word,
          definition,
          clue,
          storyContext,
          previousHints,
          attemptCount,
          grade: 3
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate hints');
      }
      
      const data = await response.json();
      setHints(data.hints);
      
    } catch (err) {
      setError(err.message);
      console.error('Error generating hints:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Use a hint
  const useHint = () => {
    if (hints.length === 0 || currentHintIndex >= hints.length || availableHints <= 0) {
      return;
    }
    
    // Get the current hint
    const hint = hints[currentHintIndex];
    
    // Update state
    setAvailableHints(prev => prev - 1);
    setCurrentHintIndex(prev => prev + 1);
    
    // Call the parent callback
    if (onUseHint) {
      onUseHint(hint);
    }
  };
  
  // Close the hint system
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };
  
  // Determine if more hints are available
  const canUseMoreHints = availableHints > 0 && currentHintIndex < hints.length;
  
  return (
    <div className={styles.hintContainer}>
      <div className={styles.hintHeader}>
        <div className={styles.hintTitle}>Hint Helper</div>
        <button 
          className={styles.closeButton}
          onClick={handleClose}
        >
          ✕
        </button>
      </div>
      
      <div className={styles.hintContent}>
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Creating hints...</p>
          </div>
        ) : error ? (
          <div className={styles.errorMessage}>
            <p>Sorry, I couldn't create hints right now.</p>
            <button 
              className={styles.retryButton}
              onClick={generateHints}
            >
              Try Again
            </button>
          </div>
        ) : hints.length > 0 ? (
          <div className={styles.hintsDisplay}>
            <div className={styles.hintCounter}>
              Hints: {availableHints} remaining
            </div>
            
            <div className={styles.usedHints}>
              {hints.slice(0, currentHintIndex).map((hint, index) => (
                <div key={index} className={styles.usedHintItem}>
                  <div className={styles.hintIcon}>💡</div>
                  <div className={styles.hintText}>{hint.text}</div>
                </div>
              ))}
            </div>
            
            <AnimatePresence>
              {canUseMoreHints && (
                <motion.div 
                  className={styles.hintButtonContainer}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <button
                    className={styles.useHintButton}
                    onClick={useHint}
                  >
                    Use a Hint
                  </button>
                  <p className={styles.hintDescription}>
                    {currentHintIndex === 0
                      ? "This will give you a small clue about the word."
                      : currentHintIndex === 1
                      ? "This will show you the first letter of the word."
                      : "This will show you a picture that represents the word."
                    }
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            
            {!canUseMoreHints && currentHintIndex > 0 && (
              <div className={styles.noMoreHints}>
                <p>You've used all available hints for this word.</p>
                <p className={styles.encouragement}>You can do it! Try to solve the puzzle with the hints you have.</p>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>Ready to help you solve the puzzle!</p>
            <button 
              className={styles.generateButton}
              onClick={generateHints}
            >
              Generate Hints
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdaptiveHintSystem;