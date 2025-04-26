// src/pages/games/soundsafari/ResultScreen/index.jsx <updated on 2025-04-25>
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from '../../../../styles/games/safari/ResultsScreen.module.css';
import ResultCard from './ResultCard';
import { playCelebrationSound } from '../../../../utils/soundUtils';

/**
 * Results screen component displaying round results
 * Redesigned with horizontal layout and no overflow/scroll
 */
const ResultsScreen = ({ results, onNextRound, onTryAgain }) => {
  const [isPlaying, setIsPlaying] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  
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
  
  // Calculate percentage score
  const score = Math.round((correctSelected.length / correctAnimals.length) * 100);
  
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
  }, [score]);
  
  return (
    <div className={styles.resultsContainer}>
      <div className={styles.resultsCard}>
        {showConfetti && (
          <div className={styles.confettiContainer}>
            {Array.from({ length: 50 }).map((_, i) => (
              <motion.div
                key={i}
                className={styles.confettiPiece}
                style={{
                  backgroundColor: `hsl(${Math.random() * 360}, 80%, 60%)`,
                  width: `${Math.random() * 10 + 5}px`,
                  height: `${Math.random() * 10 + 5}px`,
                  top: `-50px`,
                  left: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [`0vh`, `100vh`],
                  x: [0, Math.random() * 100 - 50],
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
        
        {/* Results Content Grid */}
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
                  {correctSelected.map(animal => (
                    <motion.div 
                      key={animal.id}
                      className={styles.animalResult}
                      onClick={() => handlePlaySound(animal)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: Math.random() * 0.3 }}
                    >
                      <div className={styles.animalIcon}>
                        {animal.image}
                      </div>
                      <div className={styles.animalName}>
                        {animal.name}
                        <motion.div 
                          className={styles.soundIcon}
                          animate={isPlaying === animal.id ? { 
                            scale: [1, 1.2, 1],
                            color: ['#4a9240', '#ffd600', '#4a9240']
                          } : {}}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        >
                          🔊
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyMessage}>
                  <p>You didn't find any animals with the "{targetSound}" sound.</p>
                </div>
              )}
            </div>
            
            {/* Teacher Tip */}
            <div className={styles.teacherTip}>
              <div className={styles.tipHeader}>
                <span className={styles.tipIcon}>💡</span>
                <h4>Teacher Tip:</h4>
              </div>
              <p>Ask students to think of other words that have the "{targetSound}" sound and create their own animal names using this sound!</p>
            </div>
          </div>
          
          {/* Middle Column - Incorrect Answers */}
          <div className={styles.resultsColumn}>
            {incorrectSelected.length > 0 && (
              <div className={styles.resultSection}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionIcon}>❌</span>
                  <h3>Incorrect Choices</h3>
                </div>
                <div className={styles.animalsGrid}>
                  {incorrectSelected.map(animal => (
                    <motion.div 
                      key={animal.id}
                      className={`${styles.animalResult} ${styles.incorrect}`}
                      onClick={() => handlePlaySound(animal)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: Math.random() * 0.3 + 0.2 }}
                    >
                      <div className={styles.animalIcon}>
                        {animal.image}
                      </div>
                      <div className={styles.animalName}>
                        {animal.name}
                        <motion.div 
                          className={styles.soundIcon}
                          animate={isPlaying === animal.id ? { 
                            scale: [1, 1.2, 1],
                            color: ['#4a9240', '#ffd600', '#4a9240']
                          } : {}}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        >
                          🔊
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Right Column - Missed Animals */}
          <div className={styles.resultsColumn}>
            {missedCorrect.length > 0 && (
              <div className={styles.resultSection}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionIcon}>🔍</span>
                  <h3>You Missed These</h3>
                </div>
                <div className={styles.animalsGrid}>
                  {missedCorrect.map(animal => (
                    <motion.div 
                      key={animal.id}
                      className={`${styles.animalResult} ${styles.missed}`}
                      onClick={() => handlePlaySound(animal)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: Math.random() * 0.3 + 0.4 }}
                    >
                      <div className={styles.animalIcon}>
                        {animal.image}
                      </div>
                      <div className={styles.animalName}>
                        {animal.name}
                        <motion.div 
                          className={styles.soundIcon}
                          animate={isPlaying === animal.id ? { 
                            scale: [1, 1.2, 1],
                            color: ['#4a9240', '#ffd600', '#4a9240']
                          } : {}}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        >
                          🔊
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          <motion.button 
            className={styles.tryAgainButton}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onTryAgain}
          >
            <span className={styles.buttonIcon}>🔄</span>
            Try Again
          </motion.button>
          <motion.button 
            className={styles.nextButton}
            whileHover={{ scale: 1.05, boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)" }}
            whileTap={{ scale: 0.95 }}
            onClick={onNextRound}
          >
            <span className={styles.buttonIcon}>⏩</span>
            Next Challenge
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen;