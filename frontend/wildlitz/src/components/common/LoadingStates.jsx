// src/components/common/LoadingStates.jsx - FULL SCREEN IMMERSIVE VERSION
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../styles/components/LoadingStates.module.css';

// Generic loading spinner
export const LoadingSpinner = ({ size = 'medium', message = 'Loading...' }) => {
  const sizeClasses = {
    small: styles.small,
    medium: styles.medium,
    large: styles.large
  };

  return (
    <div className={styles.spinnerContainer}>
      <motion.div 
        className={`${styles.spinner} ${sizeClasses[size]}`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        📚
      </motion.div>
      {message && <p className={styles.loadingMessage}>{message}</p>}
    </div>
  );
};

// ⭐ FULL SCREEN IMMERSIVE Story Loading Screen with REALISTIC Progress
export const StoryLoadingScreen = ({ progress = 0, message = 'Creating your adventure...', showWarning = false }) => {
  // ✅ LOCAL STATE for smooth realistic progress animation
  const [displayProgress, setDisplayProgress] = useState(0);
  
  // ✅ Animate progress smoothly when prop changes
  useEffect(() => {
    const animationDuration = 800; // 800ms for smooth transition
    const steps = 60; // 60 frames
    const stepDuration = animationDuration / steps;
    const progressDiff = progress - displayProgress;
    const progressStep = progressDiff / steps;
    
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      setDisplayProgress(prev => {
        const newProgress = prev + progressStep;
        if (currentStep >= steps) {
          clearInterval(interval);
          return progress; // Ensure we end exactly at target
        }
        return newProgress;
      });
    }, stepDuration);
    
    return () => clearInterval(interval);
  }, [progress]);
  
  const progressMessages = [
    { emoji: "🌟", text: "Choosing the perfect adventure theme..." },
    { emoji: "✍️", text: "Writing an engaging story just for you..." },
    { emoji: "🧩", text: "Creating fun crossword puzzles..." },
    { emoji: "🎨", text: "Adding colorful details and characters..." },
    { emoji: "✨", text: "Adding final magical touches..." },
    { emoji: "🎉", text: "Almost ready for your reading adventure!" }
  ];

  const currentMessageIndex = Math.min(Math.floor(displayProgress / 20), progressMessages.length - 1);
  const currentMessage = progressMessages[currentMessageIndex];

  return (
    <div className={styles.fullscreenLoadingContainer}>
      {/* Animated gradient background */}
      <motion.div 
        className={styles.gradientBackground}
        animate={{
          background: [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #764ba2 0%, #f093fb 100%)',
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          ]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Floating particles background */}
      <div className={styles.particlesContainer}>
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className={styles.particle}
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0,
              scale: Math.random() * 0.5 + 0.5
            }}
            animate={{ 
              x: [
                Math.random() * window.innerWidth,
                Math.random() * window.innerWidth
              ],
              y: [
                Math.random() * window.innerHeight,
                Math.random() * window.innerHeight
              ],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.3, 1],
              rotate: [0, 360]
            }}
            transition={{ 
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
          >
            {['✨', '📚', '🌟', '⭐', '💫', '📖'][i % 6]}
          </motion.div>
        ))}
      </div>

      {/* Main content */}
      <motion.div 
        className={styles.fullscreenContent}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Animated sword icon */}
        <motion.div 
          className={styles.heroIcon}
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 5, 0, -5, 0]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          🗡️
        </motion.div>

        {/* Title with shimmer effect */}
        <div className={styles.heroTitleWrapper}>
          <h1 className={styles.heroTitle}>
            <span className={styles.heroTitleText}>Creating Your Adventure</span>
            <motion.div
              className={styles.heroTitleShimmer}
              animate={{ x: ['-100%', '200%'] }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </h1>
        </div>

        {/* Beautiful progress section */}
        <div className={styles.heroProgressSection}>
          {/* Progress bar */}
          <div className={styles.heroProgressWrapper}>
            <div className={styles.heroProgressBar}>
              <motion.div 
                className={styles.heroProgressFill}
                style={{ width: `${displayProgress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {/* Animated shine effect */}
                <motion.div
                  className={styles.heroProgressShine}
                  animate={{ x: ['-100%', '300%'] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                {/* Progress sparkles */}
                {displayProgress > 5 && (
                  <>
                    {[...Array(4)].map((_, i) => (
                      <motion.div
                        key={i}
                        className={styles.heroProgressSparkle}
                        initial={{ x: 0, y: 0, opacity: 0 }}
                        animate={{ 
                          x: [0, Math.random() * 30 - 15],
                          y: [-20, -50],
                          opacity: [0, 1, 0],
                          scale: [0.5, 1, 0.5]
                        }}
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                          delay: i * 0.25
                        }}
                      >
                        ✨
                      </motion.div>
                    ))}
                  </>
                )}
              </motion.div>
              
              {/* Progress glow effect */}
              <motion.div
                className={styles.heroProgressGlow}
                style={{ width: `${displayProgress}%` }}
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            
            {/* Percentage badge - Large and prominent */}
            <motion.div 
              className={styles.heroProgressBadge}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className={styles.heroProgressNumber}>{Math.round(displayProgress)}</span>
              <span className={styles.heroProgressSymbol}>%</span>
            </motion.div>
          </div>
        </div>

        {/* Dynamic message with icon and animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMessage.text}
            className={styles.heroMessageContainer}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.5 }}
          >
            <motion.span 
              className={styles.heroMessageEmoji}
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {currentMessage.emoji}
            </motion.span>
            <p className={styles.heroMessageText}>{currentMessage.text}</p>
          </motion.div>
        </AnimatePresence>

        {/* Animated loading dots */}
        <div className={styles.heroLoadingDots}>
          {[0, 0.15, 0.3].map((delay, i) => (
            <motion.span 
              key={i}
              className={styles.heroDot}
              animate={{ 
                opacity: [0.3, 1, 0.3],
                y: [0, -12, 0],
                scale: [1, 1.3, 1]
              }}
              transition={{ 
                duration: 1.2,
                repeat: Infinity,
                delay: delay,
                ease: "easeInOut"
              }}
            >
              ●
            </motion.span>
          ))}
        </div>

        {/* Warning for slow connection */}
        {showWarning && displayProgress < 95 && (
          <motion.div 
            className={styles.heroWarningMessage}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div 
              className={styles.heroWarningIcon}
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            >
              ⏰
            </motion.div>
            <div className={styles.heroWarningContent}>
              <p className={styles.heroWarningTitle}>Taking longer than expected...</p>
              <p className={styles.heroWarningText}>Creating something amazing for you! Please wait...</p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

// Game loading screen
export const GameLoadingScreen = ({ message = 'Loading your game...', subMessage = '' }) => {
  return (
    <div className={styles.gameLoadingContainer}>
      <motion.div 
        className={styles.gameLoadingContent}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Puzzle pieces animation */}
        <div className={styles.puzzleContainer}>
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className={styles.puzzlePiece}
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2
              }}
            >
              🧩
            </motion.div>
          ))}
        </div>

        <h2 className={styles.gameLoadingTitle}>{message}</h2>
        {subMessage && <p className={styles.gameLoadingSubtitle}>{subMessage}</p>}
        
        {/* Pulsing loader */}
        <motion.div 
          className={styles.pulseLoader}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.div>
    </div>
  );
};

// Word loading animation
export const WordLoadingAnimation = ({ word = 'LOADING' }) => {
  return (
    <div className={styles.wordLoadingContainer}>
      {word.split('').map((letter, index) => (
        <motion.span
          key={index}
          className={styles.loadingLetter}
          animate={{ 
            y: [0, -20, 0],
            color: ['#333', '#667eea', '#333']
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: index * 0.1
          }}
        >
          {letter}
        </motion.span>
      ))}
    </div>
  );
};

// Skeleton loading for content
export const SkeletonLoader = ({ lines = 3, width = '100%', height = '20px' }) => {
  return (
    <div className={styles.skeletonContainer}>
      {[...Array(lines)].map((_, i) => (
        <motion.div
          key={i}
          className={styles.skeletonLine}
          style={{
            width: i === lines - 1 ? '70%' : width,
            height: height,
            marginBottom: '10px'
          }}
          animate={{
            opacity: [0.3, 0.7, 0.3]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.2
          }}
        />
      ))}
    </div>
  );
};

// Button loading state
export const LoadingButton = ({ 
  isLoading, 
  children, 
  loadingText = 'Loading...', 
  className = '',
  onClick,
  disabled,
  ...props 
}) => {
  return (
    <button
      className={`${styles.loadingButton} ${className} ${isLoading ? styles.loading : ''}`}
      onClick={onClick}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <div className={styles.buttonLoadingContent}>
          <motion.div 
            className={styles.buttonSpinner}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <span>{loadingText}</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};

// Crossword grid loading
export const CrosswordGridLoader = ({ size = 10 }) => {
  return (
    <div className={styles.gridLoaderContainer}>
      <div 
        className={styles.gridLoader}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          gap: '2px'
        }}
      >
        {[...Array(size * size)].map((_, i) => (
          <motion.div
            key={i}
            className={styles.gridCell}
            animate={{
              backgroundColor: ['#f0f0f0', '#e0e0e0', '#f0f0f0'],
              scale: [1, 1.05, 1]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: (i % 10) * 0.1
            }}
          />
        ))}
      </div>
      <p className={styles.gridLoaderText}>Loading puzzle...</p>
    </div>
  );
};

// Success animation
export const SuccessAnimation = ({ message = 'Success!', onComplete }) => {
  return (
    <motion.div 
      className={styles.successContainer}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      onAnimationComplete={onComplete}
    >
      <motion.div 
        className={styles.successIcon}
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 0.5 }}
      >
        ✅
      </motion.div>
      <p className={styles.successMessage}>{message}</p>
    </motion.div>
  );
};

export default {
  LoadingSpinner,
  StoryLoadingScreen,
  GameLoadingScreen,
  WordLoadingAnimation,
  SkeletonLoader,
  LoadingButton,
  CrosswordGridLoader,
  SuccessAnimation
};