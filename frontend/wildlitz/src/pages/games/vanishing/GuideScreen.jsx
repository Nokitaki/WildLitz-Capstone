// src/pages/games/vanishing/GuideScreen.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../../styles/games/vanishing/GuideScreen.module.css';

/**
 * GuideScreen component that shows instructions before the game starts
 */
const GuideScreen = ({ onStartGame, config }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Guide steps with animations
  const guideSteps = [
    {
      emoji: '👀',
      title: 'Step 1: Watch the Word!',
      description: 'A word or sentence will appear on the screen. Look carefully and read it together!',
      image: '📝',
      tip: 'Pay attention to every letter and sound in the word'
    },
    {
      emoji: '✨',
      title: 'Step 2: Letters Vanish!',
      description: 'Watch as some letters disappear! Can you remember what was there before?',
      image: '💨',
      tip: 'Try to remember the complete word in your mind'
    },
    {
      emoji: '🗣️',
      title: 'Step 3: Say It Out Loud!',
      description: config.teamPlay 
        ? 'Teams take turns saying the complete word or what letters vanished. Speak clearly!'
        : 'Raise your hand and say the complete word out loud when called on!',
      image: '🎤',
      tip: 'Sound it out slowly if you need help'
    },
    {
      emoji: '✅',
      title: 'Step 4: Mark the Answer!',
      description: 'Press "Correct ✓" if the answer is right or "Incorrect ✗" if wrong. Keep playing!',
      image: '🎯',
      tip: config.teamPlay 
        ? 'Teams earn points for correct answers!'
        : 'Every attempt helps you learn!'
    },
    {
      emoji: '🎉',
      title: 'Ready to Start?',
      description: config.teamPlay
        ? `${config.teamAName || 'Team A'} vs ${config.teamBName || 'Team B'} - Let the competition begin!`
        : 'Let\'s practice phonics together and have fun learning!',
      image: '🚀',
      tip: 'Remember: Learning is a team effort. Help each other and have fun!'
    }
  ];

  const handleNext = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Last step - start game with loading indicator
      setIsLoading(true);
      onStartGame();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setIsLoading(true);
    onStartGame();
  };

  const currentGuide = guideSteps[currentStep];
  const isLastStep = currentStep === guideSteps.length - 1;

  // Show loading screen while generating words
  if (isLoading) {
    return (
      <div className={styles.guideContainer}>
        <motion.div 
          className={styles.loadingScreen}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className={styles.loadingSpinner}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            🎮
          </motion.div>
          <h2 className={styles.loadingTitle}>Generating Your Game!</h2>
          <p className={styles.loadingText}>
            {config.teamPlay 
              ? `Preparing ${config.numberOfQuestions || 10} words for ${config.teamAName || 'Team A'} vs ${config.teamBName || 'Team B'}...`
              : `Creating ${config.numberOfQuestions || 10} awesome phonics challenges...`
            }
          </p>
          <motion.div 
            className={styles.loadingDots}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
          >
            ✨ AI is working its magic ✨
          </motion.div>
          <div className={styles.loadingDetails}>
            <div className={styles.detailItem}>
              <span className={styles.detailIcon}>📚</span>
              <span>{config.challengeLevel?.replace('_', ' ')}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailIcon}>🎯</span>
              <span>{config.learningFocus?.replace('_', ' ')}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailIcon}>⚡</span>
              <span>{config.difficulty}</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={styles.guideContainer}>
      {/* Background decoration */}
      <div className={styles.backgroundDecoration}>
        <div className={styles.floatingShape} style={{ top: '10%', left: '10%' }}>✨</div>
        <div className={styles.floatingShape} style={{ top: '20%', right: '15%' }}>🌟</div>
        <div className={styles.floatingShape} style={{ bottom: '15%', left: '15%' }}>💫</div>
        <div className={styles.floatingShape} style={{ bottom: '10%', right: '10%' }}>⭐</div>
      </div>

      <motion.div 
        className={styles.guideCard}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className={styles.guideHeader}>
          <motion.div 
            className={styles.headerEmoji}
            key={currentGuide.emoji}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', bounce: 0.6 }}
          >
            {currentGuide.emoji}
          </motion.div>
          <h2 className={styles.guideTitle}>How to Play</h2>
          <button 
            className={styles.skipButton}
            onClick={handleSkip}
          >
            Skip Guide →
          </button>
        </div>

        {/* Progress bar */}
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <motion.div 
              className={styles.progressFill}
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / guideSteps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className={styles.progressText}>
            Step {currentStep + 1} of {guideSteps.length}
          </p>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            className={styles.guideContent}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <div className={styles.imageContainer}>
              <motion.div 
                className={styles.guideImage}
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {currentGuide.image}
              </motion.div>
            </div>

            <h3 className={styles.stepTitle}>{currentGuide.title}</h3>
            <p className={styles.stepDescription}>{currentGuide.description}</p>

            <div className={styles.tipBox}>
              <span className={styles.tipIcon}>💡</span>
              <p className={styles.tipText}>{currentGuide.tip}</p>
            </div>

            {/* Show game config on last step */}
            {isLastStep && (
              <motion.div 
                className={styles.configSummary}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h4>Your Game Settings:</h4>
                <div className={styles.summaryGrid}>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Challenge:</span>
                    <span className={styles.summaryValue}>
                      {config.challengeLevel?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Focus:</span>
                    <span className={styles.summaryValue}>
                      {config.learningFocus?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Difficulty:</span>
                    <span className={styles.summaryValue}>{config.difficulty}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Questions:</span>
                    <span className={styles.summaryValue}>{config.numberOfQuestions}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className={styles.navigationButtons}>
          <motion.button
            className={styles.navButton}
            onClick={handlePrevious}
            disabled={currentStep === 0}
            whileHover={{ scale: currentStep === 0 ? 1 : 1.05 }}
            whileTap={{ scale: currentStep === 0 ? 1 : 0.95 }}
          >
            ← Previous
          </motion.button>

          <div className={styles.dotIndicators}>
            {guideSteps.map((_, index) => (
              <motion.div
                key={index}
                className={`${styles.dot} ${index === currentStep ? styles.activeDot : ''}`}
                onClick={() => setCurrentStep(index)}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </div>

          <motion.button
            className={`${styles.navButton} ${styles.nextButton} ${isLastStep ? styles.startButton : ''}`}
            onClick={handleNext}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLastStep ? '🎮 Start Game!' : 'Next →'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default GuideScreen;