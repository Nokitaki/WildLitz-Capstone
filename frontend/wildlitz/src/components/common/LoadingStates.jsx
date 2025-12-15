import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../styles/components/LoadingStates.module.css';

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

export const StoryLoadingScreen = ({ 
  progress = 0, 
  message = 'Creating your adventure...', 
  showWarning = false 
}) => {
  const [displayProgress, setDisplayProgress] = useState(0);
  
  // Smooth progress animation
  useEffect(() => {
    const animationDuration = 800;
    const steps = 40; // Reduced from 60
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
          return progress;
        }
        return newProgress;
      });
    }, stepDuration);
    
    return () => clearInterval(interval);
  }, [progress]);
  
  // Progress messages
  const progressMessages = [
    { emoji: "🌟", text: "Selecting your perfect adventure theme..." },
    { emoji: "✏️", text: "Writing an engaging tale just for you..." },
    { emoji: "🎨", text: "Adding vibrant colors and characters..." },
    { emoji: "🧩", text: "Crafting exciting crossword puzzles..." },
    { emoji: "✨", text: "Adding final touches of magic..." },
    { emoji: "🎉", text: "Your reading adventure is almost ready!" }
  ];
  
  const currentMessage = progressMessages[Math.min(
    Math.floor((displayProgress / 100) * progressMessages.length),
    progressMessages.length - 1
  )];
  
  // Reduced particles - only 6 instead of 12
  const particles = ['📚', '✏️', '🎨', '⭐', '🌈', '✨'];
  const [particlePositions, setParticlePositions] = useState([]);
  
  useEffect(() => {
    const positions = particles.map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2
    }));
    setParticlePositions(positions);
  }, []);
  
  return (
    <div className={styles.fullscreenLoadingContainer}>
      {/* Static gradient background */}
      <div className={styles.gradientBackground} />
      
      {/* Reduced particles */}
      <div className={styles.particlesContainer}>
        {particles.map((emoji, index) => (
          <div
            key={index}
            className={styles.particle}
            style={{
              left: `${particlePositions[index]?.x || 0}%`,
              top: `${particlePositions[index]?.y || 0}%`,
              animationDelay: `${particlePositions[index]?.delay || 0}s`
            }}
          >
            {emoji}
          </div>
        ))}
      </div>
      
      {/* Main content */}
      <div className={styles.fullscreenContent}>
        {/* Hero icon */}
        <div className={styles.heroIcon}>
          📖✨
        </div>
        
        {/* Title */}
        <div className={styles.heroTitleWrapper}>
          <h1 className={styles.heroTitle}>
            {message}
          </h1>
        </div>
        
        {/* Progress bar with badge */}
        <div className={styles.heroProgressWrapper}>
          {/* Progress bar */}
          <div className={styles.heroProgressBarContainer}>
            <div className={styles.heroProgressBar}>
              <div 
                className={styles.heroProgressFill}
                style={{ width: `${displayProgress}%` }}
              >
                {/* Shine effect */}
                <div className={styles.heroProgressShine} />
              </div>
              
              {/* Sparkle at the end */}
              {displayProgress > 5 && (
                <div 
                  className={styles.heroProgressSparkle}
                  style={{ left: `${displayProgress}%` }}
                >
                  ✨
                </div>
              )}
            </div>
          </div>
          
          {/* Percentage badge */}
          <div className={styles.heroProgressBadge}>
            <span className={styles.heroProgressNumber}>
              {Math.round(displayProgress)}
            </span>
            <span className={styles.heroProgressSymbol}>%</span>
          </div>
        </div>
        
        {/* Dynamic message */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMessage.text}
            className={styles.heroMessageContainer}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <span className={styles.heroMessageEmoji}>
              {currentMessage.emoji}
            </span>
            <p className={styles.heroMessageText}>{currentMessage.text}</p>
          </motion.div>
        </AnimatePresence>
        
        {/* Loading dots */}
        <div className={styles.heroLoadingDots}>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className={styles.heroDot}
              animate={{ 
                opacity: [0.3, 1, 0.3],
                scale: [0.9, 1.2, 0.9]
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.25
              }}
            >
              •
            </motion.span>
          ))}
        </div>
        
        {/* Warning message */}
        {showWarning && (
          <motion.div 
            className={styles.heroWarningMessage}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <span className={styles.heroWarningIcon}>
              ⚠️
            </span>
            <div className={styles.heroWarningContent}>
              <h4 className={styles.heroWarningTitle}>Taking Longer Than Expected</h4>
              <p className={styles.heroWarningText}>
                AI story generation can take some time. Please wait while we craft something amazing...
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export const GameLoadingScreen = ({ 
  message = 'Loading your game...', 
  subMessage = '' 
}) => {
  return (
    <div className={styles.gameLoadingContainer}>
      <motion.div 
        className={styles.gameLoadingContent}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Animated puzzle pieces */}
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
          animate={{ 
            scale: [1, 1.3, 1], 
            opacity: [0.5, 1, 0.5] 
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.div>
    </div>
  );
};

export const CrosswordGridLoader = ({ 
  message = 'Preparing your crossword...' 
}) => {
  return (
    <div className={styles.gameLoadingContainer}>
      <motion.div 
        className={styles.gameLoadingContent}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Animated grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(5, 40px)', 
          gap: '5px',
          marginBottom: '30px'
        }}>
          {[...Array(25)].map((_, i) => (
            <motion.div
              key={i}
              style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '6px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
              }}
              animate={{ 
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1, 0.8]
              }}
              transition={{ 
                duration: 1.8,
                repeat: Infinity,
                delay: i * 0.06
              }}
            />
          ))}
        </div>

        <h2 className={styles.gameLoadingTitle}>{message}</h2>
        
        {/* Pulsing loader */}
        <motion.div 
          className={styles.pulseLoader}
          animate={{ 
            scale: [1, 1.3, 1], 
            opacity: [0.5, 1, 0.5] 
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.div>
    </div>
  );
};

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
            duration: 0.8,
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

export const SkeletonLoader = ({ 
  lines = 3, 
  width = '100%', 
  height = '20px' 
}) => {
  return (
    <div className={styles.skeletonContainer}>
      {[...Array(lines)].map((_, i) => (
        <motion.div
          key={i}
          className={styles.skeletonLine}
          style={{
            width: i === lines - 1 ? `${parseInt(width) * 0.7}%` : width,
            height,
            marginBottom: '10px'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
        />
      ))}
    </div>
  );
};