// src/pages/games/soundsafari/ResultScreen.jsx
// FIXED VERSION - Correct scoring when no animals have the target sound

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import styles from '../../../styles/games/safari/ResultsScreen.module.css';
import { playCelebrationSound, playSpeech, stopAllSpeech } from '../../../utils/soundUtils';

const ResultsScreen = ({ results, onNextRound, onTryAgain }) => {
  const [isPlaying, setIsPlaying] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [feedbackPlayed, setFeedbackPlayed] = useState(false);
  
  // Component lifecycle tracking
  const isMountedRef = useRef(true);
  const speechTimeoutRef = useRef(null);
  
  // Extract results
  const { correctAnimals, incorrectAnimals, selectedAnimals, targetSound } = results;
  
  // Calculate results
  const correctSelected = selectedAnimals.filter(animal => 
    correctAnimals.some(a => a.id === animal.id)
  );
  
  const incorrectSelected = selectedAnimals.filter(animal => 
    incorrectAnimals.some(a => a.id === animal.id)
  );
  
  const missedCorrect = correctAnimals.filter(animal => 
    !selectedAnimals.some(a => a.id === animal.id)
  );
  
  // ✅ FIXED: Calculate score with proper handling for "no correct animals" case
  const calculateScore = () => {
    // Special case: No correct animals exist (no animals with target sound)
    if (!correctAnimals || correctAnimals.length === 0) {
      // If player also selected nothing, that's CORRECT! (100%)
      if (!selectedAnimals || selectedAnimals.length === 0) {
        return 100;
      }
      // If player selected something when nothing was correct, that's WRONG (0%)
      return 0;
    }
    
    // Normal case: Calculate based on correct selections
    const rawScore = (correctSelected.length / correctAnimals.length) * 100;
    if (isNaN(rawScore) || !isFinite(rawScore)) return 0;
    return Math.round(rawScore);
  };
  
  const score = calculateScore();
  
  // Feedback messages
  const getFeedbackMessage = () => {
    if (score >= 90) return "Excellent Work!";
    if (score >= 70) return "Great Job!";
    if (score >= 50) return "Good Effort!";
    return "Keep Practicing!";
  };
  
  const getFeedbackIcon = () => {
    if (score >= 90) return "🏆";
    if (score >= 70) return "🌟";
    if (score >= 50) return "👍";
    return "🌱";
  };
  
  // ✅ FIXED: Better feedback messages for edge cases
  const getCharacterFeedback = () => {
    // Special case: No animals with target sound
    if (!correctAnimals || correctAnimals.length === 0) {
      if (score === 100) {
        return `Perfect! You correctly identified that there were NO animals with the "${targetSound}" sound! Great listening skills! 🎯`;
      } else {
        return `Oops! There were NO animals with the "${targetSound}" sound, so you shouldn't have selected any. Let's try again!`;
      }
    }
    
    // Normal case messages
    const correctMessage = `You found ${correctSelected.length} out of ${correctAnimals.length} animals with the "${targetSound}" sound!`;
    
    if (score >= 90) {
      return `Wonderful job! ${correctMessage} That's excellent listening!`;
    } else if (score >= 70) {
      return `Great work! ${correctMessage} You're becoming a sound expert!`;
    } else if (score >= 50) {
      return `Good effort! ${correctMessage} Keep practicing and you'll get even better.`;
    } else if (score === 0 && correctAnimals.length > 0) {
      return `${correctMessage} Don't worry! Let's try listening more carefully next time.`;
    } else {
      return `${correctMessage} Keep practicing to improve your sound recognition!`;
    }
  };
  
  // Play animal sound
  const handlePlaySound = (animal) => {
    if (isPlaying || !isMountedRef.current) return;
    
    setIsPlaying(animal.id);
    playSpeech(animal.name, 0.8, () => {
      if (isMountedRef.current) {
        setIsPlaying(null);
      }
    });
  };
  
  // Initialize effects
  useEffect(() => {
    isMountedRef.current = true;
    
    // Play celebration
    if (score >= 70) {
      setShowConfetti(true);
      playCelebrationSound(score);
    }
    
    // Play feedback
    if (!feedbackPlayed) {
      speechTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          playSpeech(getCharacterFeedback(), 0.9, () => {
            if (isMountedRef.current) {
              setFeedbackPlayed(true);
            }
          });
        }
      }, 1000);
    }
    
    // Cleanup
    return () => {
      console.log('🧹 ResultsScreen unmounting');
      isMountedRef.current = false;
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
      stopAllSpeech();
    };
  }, []);
  
  // Navigation handlers
  const handleNextRoundClick = () => {
    stopAllSpeech();
    setTimeout(() => onNextRound(), 100);
  };
  
  const handleTryAgainClick = () => {
    stopAllSpeech();
    setTimeout(() => onTryAgain(), 100);
  };
  
  return (
    <div className={styles.resultsContainer}>
      <div className={styles.resultsCard}>
        {/* Confetti */}
        {showConfetti && (
          <div className={styles.confettiContainer}>
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.div
                key={i}
                className={styles.confettiPiece}
                style={{
                  backgroundColor: `hsl(${Math.random() * 360}, 80%, 60%)`,
                  width: `${Math.random() * 8 + 5}px`,
                  height: `${Math.random() * 8 + 5}px`,
                  top: `-20px`,
                  left: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [`0vh`, `100vh`],
                  x: [0, Math.random() * 80 - 40],
                  rotate: [0, Math.random() * 360 * (Math.random() > 0.5 ? 1 : -1)],
                }}
                transition={{
                  duration: Math.random() * 2 + 2,
                  ease: "linear",
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>
        )}
        
        {/* Header */}
        <div className={styles.resultsHeader}>
          <h2 className={styles.resultsTitle}>
            <span className={styles.titleEmoji}>🔍</span>
            Safari Results
          </h2>
        </div>
        
        {/* Score Banner */}
        <div className={styles.scoreSection}>
          <div className={styles.scoreBanner} style={{ 
            backgroundImage: `linear-gradient(to right, 
              ${score >= 70 ? '#4caf50' : score >= 50 ? '#ff9800' : '#f44336'}, 
              ${score >= 70 ? '#81c784' : score >= 50 ? '#ffb74d' : '#ef5350'})` 
          }}>
            <div className={styles.scoreIcon}>{getFeedbackIcon()}</div>
            <div className={styles.scoreContent}>
              <div className={styles.scoreLabel}>{getFeedbackMessage()}</div>
              <div className={styles.scoreValue}>{score}%</div>
            </div>
          </div>
          
          <div className={styles.scoreInfo}>
            <span className={styles.scoreText}>
              You found: <span>{correctSelected.length}/{correctAnimals.length || 0}</span>
            </span>
          </div>
        </div>
        
        {/* Feedback Message - Special case for no correct animals */}
        {(!correctAnimals || correctAnimals.length === 0) && (
          <div className={styles.feedbackMessageBox}>
            <p className={styles.feedbackContent}>
              {score === 100 
                ? `🎯 Smart choice! There were no animals with the "${targetSound}" sound.`
                : `💡 Tip: There were no animals with the "${targetSound}" sound in this round!`
              }
            </p>
          </div>
        )}
        
        {/* Results Content - Three Columns */}
        <div className={styles.resultsContent}>
          {/* Correct Animals Column */}
          <div className={styles.resultsColumn}>
            <div className={styles.resultSection}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>✅</span>
                <h3>Correct Animals</h3>
              </div>
              
              {correctSelected.length > 0 ? (
                <div className={styles.animalsGrid}>
                  {correctSelected.map((animal) => (
                    <motion.div
                      key={animal.id}
                      className={styles.animalResult}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => handlePlaySound(animal)}
                    >
                      <div className={styles.animalResultImage}>
                        {animal.image_url ? (
                          <img src={animal.image_url} alt={animal.name} />
                        ) : (
                          <span>🐾</span>
                        )}
                      </div>
                      <div className={styles.animalResultName}>{animal.name}</div>
                      <button className={styles.playSoundBtn}>
                        {isPlaying === animal.id ? '🔊' : '🔈'}
                      </button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p>
                    {correctAnimals && correctAnimals.length === 0 
                      ? `No animals with "${targetSound}" sound` 
                      : 'No correct animals selected'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Missed Animals Column */}
          {missedCorrect.length > 0 && (
            <div className={styles.resultsColumn}>
              <div className={styles.resultSection}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionIcon}>❗</span>
                  <h3>You Missed These</h3>
                </div>
                
                <div className={styles.animalsGrid}>
                  {missedCorrect.map((animal) => (
                    <motion.div
                      key={animal.id}
                      className={styles.animalResult}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => handlePlaySound(animal)}
                    >
                      <div className={styles.animalResultImage}>
                        {animal.image_url ? (
                          <img src={animal.image_url} alt={animal.name} />
                        ) : (
                          <span>🐾</span>
                        )}
                      </div>
                      <div className={styles.animalResultName}>{animal.name}</div>
                      <button className={styles.playSoundBtn}>
                        {isPlaying === animal.id ? '🔊' : '🔈'}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Incorrect Selections Column */}
          {incorrectSelected.length > 0 && (
            <div className={styles.resultsColumn}>
              <div className={styles.resultSection}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionIcon}>❌</span>
                  <h3>Incorrect Selections</h3>
                </div>
                
                <div className={styles.animalsGrid}>
                  {incorrectSelected.map((animal) => (
                    <motion.div
                      key={animal.id}
                      className={styles.animalResult}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => handlePlaySound(animal)}
                    >
                      <div className={styles.animalResultImage}>
                        {animal.image_url ? (
                          <img src={animal.image_url} alt={animal.name} />
                        ) : (
                          <span>🐾</span>
                        )}
                      </div>
                      <div className={styles.animalResultName}>{animal.name}</div>
                      <button className={styles.playSoundBtn}>
                        {isPlaying === animal.id ? '🔊' : '🔈'}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          <motion.button
            className={styles.tryAgainButton}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleTryAgainClick}
          >
            <span className={styles.buttonIcon}>🔄</span>
            Try Again
          </motion.button>
          
          <motion.button
            className={styles.nextButton}
            whileHover={{ scale: 1.03, boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)" }}
            whileTap={{ scale: 0.97 }}
            onClick={handleNextRoundClick}
          >
            <span className={styles.buttonIcon}>▶️</span>
            Next Round
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen;