// src/pages/games/soundsafari/ResultScreen.jsx
// FIXED: Score shows 0% instead of NaN%

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from '../../../styles/games/safari/ResultsScreen.module.css';
import { playCelebrationSound, playSpeech, stopAllSpeech } from '../../../utils/soundUtils';
import WildLitzFox from '../../../assets/img/wildlitz-idle.png';

/**
 * Results screen component displaying round results
 * FIXED: Handles NaN scores properly
 */
const ResultsScreen = ({ results, onNextRound, onTryAgain }) => {
  const [isPlaying, setIsPlaying] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [feedbackPlayed, setFeedbackPlayed] = useState(false);
  
  // Extract results
  const { 
    correctAnimals, 
    incorrectAnimals, 
    selectedAnimals, 
    targetSound 
  } = results;
  
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
  
  // Calculate percentage score - FIXED: Handle NaN cases
  const calculateScore = () => {
    // If there are no correct animals, score is 0
    if (!correctAnimals || correctAnimals.length === 0) {
      return 0;
    }
    
    // Calculate the score
    const rawScore = (correctSelected.length / correctAnimals.length) * 100;
    
    // If result is NaN or Infinity, return 0
    if (isNaN(rawScore) || !isFinite(rawScore)) {
      return 0;
    }
    
    // Return rounded score
    return Math.round(rawScore);
  };
  
  const score = calculateScore();
  
  // Determine feedback message based on score
  const getFeedbackMessage = () => {
    if (score >= 90) return "Excellent Work!";
    if (score >= 70) return "Great Job!";
    if (score >= 50) return "Good Effort!";
    return "Keep Practicing!";
  };
  
  // Get feedback icon based on score
  const getFeedbackIcon = () => {
    if (score >= 90) return "🏆";
    if (score >= 70) return "🌟";
    if (score >= 50) return "👍";
    return "🌱";
  };
  
  // Play animal name sound
  const handlePlaySound = (animal) => {
    if (isPlaying) return;
    
    setIsPlaying(animal.id);
    playSpeech(animal.name, 0.8, () => setIsPlaying(null));
  };
  
  // Play celebration sound for high scores
  useEffect(() => {
    if (score > 70) {
      setShowConfetti(true);
      playCelebrationSound(score);
    }
    
    // Play character feedback after a short delay
    if (!feedbackPlayed) {
      setTimeout(() => {
        const feedbackMessage = getCharacterFeedback();
        playSpeech(feedbackMessage, 0.9, () => {
          setFeedbackPlayed(true);
        });
      }, 1000);
    }
  }, [score]);
  
  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      console.log('ResultsScreen unmounting - stopping speech');
      stopAllSpeech();
    };
  }, []);
  
  // Get character feedback based on score
  const getCharacterFeedback = () => {
    const correctMessage = `You found ${correctSelected.length} out of ${correctAnimals.length} animals with the "${targetSound}" sound!`;
    
    if (score >= 90) {
      return `Wonderful job! ${correctMessage} That's excellent listening!`;
    } else if (score >= 70) {
      return `Great work! ${correctMessage} You're becoming a sound expert!`;
    } else if (score >= 50) {
      return `Good effort! ${correctMessage} Keep practicing and you'll get even better.`;
    } else if (score === 0) {
      return `${correctMessage} Don't worry! Let's try again and listen more carefully to the sounds.`;
    } else {
      return `${correctMessage} Let's keep practicing to get better at hearing the sounds.`;
    }
  };
  
  // Handle next round - stop speech before continuing
  const handleNextRoundClick = () => {
    stopAllSpeech();
    onNextRound();
  };
  
  // Handle try again - stop speech before retrying
  const handleTryAgainClick = () => {
    stopAllSpeech();
    onTryAgain();
  };
  
  return (
    <div className={styles.resultsContainer}>
      <div className={styles.resultsCard}>
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
        
        {/* Results Header */}
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
              ${score >= 70 ? '#81c784' : score >= 50 ? '#ffb74d' : '#e57373'})` 
          }}>
            <div className={styles.scoreInfo}>
              <div className={styles.scoreText}>
                Score: <span>{score}%</span>
              </div>
              <div className={styles.feedbackMessage}>
                <span className={styles.feedbackIcon}>{getFeedbackIcon()}</span>
                {getFeedbackMessage()}
              </div>
            </div>
            <div className={styles.scoreDetails}>
              You found {correctSelected.length} of {correctAnimals.length} animals with the "{targetSound}" sound!
            </div>
          </div>
        </div>
        
        {/* Feedback Message Box */}
        <div className={styles.feedbackMessageBox}>
          <div className={styles.feedbackContent}>
            {getCharacterFeedback()}
          </div>
        </div>
        
        {/* Results Content */}
        <div className={styles.resultsContent}>
          {/* Correct Answers Column */}
          <div className={styles.resultsColumn}>
            <div className={styles.resultSection}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>✅</span>
                <h3>Correct Answers!</h3>
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
                        {animal.image && (animal.image.startsWith('http') || animal.image.startsWith('data:')) ? (
                          <img src={animal.image} alt={animal.name} />
                        ) : (
                          <span>{animal.image || '🐾'}</span>
                        )}
                      </div>
                      <div className={styles.animalResultName}>{animal.name}</div>
                      <button className={styles.playSoundBtn}>
                        {isPlaying === animal.id ? '🔊' : '🔊'}
                      </button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p>You didn't find any animals with the "{targetSound}" sound.</p>
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
                        {animal.image && (animal.image.startsWith('http') || animal.image.startsWith('data:')) ? (
                          <img src={animal.image} alt={animal.name} />
                        ) : (
                          <span>{animal.image || '🐾'}</span>
                        )}
                      </div>
                      <div className={styles.animalResultName}>{animal.name}</div>
                      <button className={styles.playSoundBtn}>
                        {isPlaying === animal.id ? '🔊' : '🔊'}
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
                        {animal.image && (animal.image.startsWith('http') || animal.image.startsWith('data:')) ? (
                          <img src={animal.image} alt={animal.name} />
                        ) : (
                          <span>{animal.image || '🐾'}</span>
                        )}
                      </div>
                      <div className={styles.animalResultName}>{animal.name}</div>
                      <button className={styles.playSoundBtn}>
                        {isPlaying === animal.id ? '🔊' : '🔊'}
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
            Next Challenge
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen;