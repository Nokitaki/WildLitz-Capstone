
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
 
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hints, setHints] = useState([]);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [availableHints, setAvailableHints] = useState(3);
  
  
  useEffect(() => {
    if (word && availableHints > 0) {
      generateHints();
    }
  }, [word]);
  
 
  const generateHints = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
     
      let unrevealedIndices = [...Array(word.length).keys()]; 
      let generatedHints = [];
      
     
      if (unrevealedIndices.length > 0) {
        const randomIndex = Math.floor(Math.random() * unrevealedIndices.length);
        const letterIndex = unrevealedIndices[randomIndex];
        
       
        let hintDisplay = '';
        for (let i = 0; i < word.length; i++) {
          if (i === letterIndex) {
            hintDisplay += word[i];
          } else {
            hintDisplay += '_ ';
          }
        }
        
        generatedHints.push({
          level: 1,
          text: `Revealing letter "${word[letterIndex]}" at position ${letterIndex + 1}: ${hintDisplay}`,
          type: "letter_reveal",
          letterIndex: letterIndex,
          letter: word[letterIndex]
        });
        
        
        unrevealedIndices.splice(randomIndex, 1);
      }
      
     
      if (unrevealedIndices.length > 0) {
        const randomIndex = Math.floor(Math.random() * unrevealedIndices.length);
        const letterIndex = unrevealedIndices[randomIndex];
        
       
        let hintDisplay = '';
        for (let i = 0; i < word.length; i++) {
          if (i === letterIndex || word[i] === generatedHints[0].letter) {
            hintDisplay += word[i] + ' ';
          } else {
            hintDisplay += '_ ';
          }
        }
        
        generatedHints.push({
          level: 2,
          text: `Revealing letter "${word[letterIndex]}" at position ${letterIndex + 1}: ${hintDisplay}`,
          type: "letter_reveal",
          letterIndex: letterIndex,
          letter: word[letterIndex]
        });
        
        
        unrevealedIndices.splice(randomIndex, 1);
      }
      
      
      generatedHints.push({
        level: 3,
        text: `The answer is "${word}": ${word.split('').join(' ')}`,
        type: "full_reveal"
      });
      
      setHints(generatedHints);
      
    } catch (err) {
      setError("Could not generate hints. Please try again.");
      console.error('Error generating hints:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
 
  const useHint = () => {
    if (hints.length === 0 || currentHintIndex >= hints.length || availableHints <= 0) {
      return;
    }
    
   
    const hint = hints[currentHintIndex];
    
   
    setAvailableHints(prev => prev - 1);
    setCurrentHintIndex(prev => prev + 1);
    
   
    if (onUseHint) {
      onUseHint(hint);
    }
  };
  

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };
  
 
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
                    Reveal a Letter
                  </button>
                  <p className={styles.hintDescription}>
                    {currentHintIndex === 0
                      ? "This will reveal a random letter in the word."
                      : currentHintIndex === 1
                      ? "This will reveal another letter in the word."
                      : "This will reveal the entire word."
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