
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


export const StoryLoadingScreen = ({ progress = 0, message = 'Creating your adventure...', showWarning = false }) => {
  
  const [displayProgress, setDisplayProgress] = useState(0);
  
  
  useEffect(() => {
    const animationDuration = 800; 
    const steps = 60; 
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
  
  const progressMessages = [
    { emoji: "🌟", text: "Choosing the perfect adventure theme..." },
    { emoji: "✍️", text: "Writing an engaging story just for you..." },
    { emoji: "🧩", text: "Creating fun crossword puzzles..." },
    { emoji: "🎨", text: "Adding colorful details and characters..." },
    { emoji: "✨", text: "Adding final magical touches..." },
    { emoji: "🎉", text: "Almost ready for your reading adventure!" }
  ];
  
  const currentMessage = progressMessages[Math.min(
    Math.floor((displayProgress / 100) * progressMessages.length),
    progressMessages.length - 1
  )];
  
 
  const particles = ['📚', '✏️', '🎨', '⭐', '🌈', '🦋', '🎭', '🎪'];
  const [particlePositions, setParticlePositions] = useState([]);
  
  useEffect(() => {
    const positions = particles.map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 4
    }));
    setParticlePositions(positions);
  }, []);
  
  return (
    <div className={styles.fullscreenLoadingContainer}>
     
      <div className={styles.gradientBackground} />
      
     
      <div className={styles.particlesContainer}>
        {particles.map((emoji, index) => (
          <motion.div
            key={index}
            className={styles.particle}
            style={{
              left: `${particlePositions[index]?.x || 0}%`,
              top: `${particlePositions[index]?.y || 0}%`
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, 15, 0],
              rotate: [0, 10, -10, 0],
              opacity: [0.3, 0.8, 0.3]
            }}
            transition={{
              duration: particlePositions[index]?.duration || 5,
              repeat: Infinity,
              delay: particlePositions[index]?.delay || 0,
              ease: "easeInOut"
            }}
          >
            {emoji}
          </motion.div>
        ))}
      </div>
      
      {/* Main Content */}
      <div className={styles.fullscreenContent}>
       
        <motion.div
          className={styles.heroIcon}
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          📖✨
        </motion.div>
        
        {/* Title */}
        <div className={styles.heroTitleWrapper}>
          <motion.h1 
            className={styles.heroTitle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {message}
          </motion.h1>
        </div>
        
        {/* Progress Bar with Percentage Badge */}
        <div className={styles.heroProgressWrapper}>
          {/* Progress Bar */}
          <div className={styles.heroProgressBarContainer}>
            <motion.div 
              className={styles.heroProgressBar}
              initial={{ width: 0 }}
              animate={{ width: `${displayProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          
          {/* Percentage Badge */}
          <motion.div 
            className={styles.heroProgressBadge}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <span className={styles.heroProgressNumber}>
              {Math.round(displayProgress)}
            </span>
            <span className={styles.heroProgressSymbol}>%</span>
          </motion.div>
        </div>
        
        {/* Dynamic Message */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMessage.text}
            className={styles.heroMessageContainer}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <span className={styles.heroMessageEmoji}>{currentMessage.emoji}</span>
            <p className={styles.heroMessageText}>{currentMessage.text}</p>
          </motion.div>
        </AnimatePresence>
        
        {/* Animated Dots */}
        <div className={styles.heroLoadingDots}>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className={styles.heroDot}
              animate={{ 
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2
              }}
            >
              •
            </motion.span>
          ))}
        </div>
        
        {/* Warning Message (if needed) */}
        {showWarning && (
          <motion.div 
            className={styles.heroWarningMessage}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <span className={styles.heroWarningIcon}>⚠️</span>
            <div className={styles.heroWarningContent}>
              <h4 className={styles.heroWarningTitle}>Taking Longer Than Expected</h4>
              <p className={styles.heroWarningText}>
                AI story generation can take some time. Please wait...
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};


export const GameLoadingScreen = ({ message = 'Loading your game...', subMessage = '' }) => {
  return (
    <div className={styles.gameLoadingContainer}>
      <motion.div 
        className={styles.gameLoadingContent}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
       
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


export const CrosswordGridLoader = ({ message = 'Preparing your crossword...' }) => {
  return (
    <div className={styles.gameLoadingContainer}>
      <motion.div 
        className={styles.gameLoadingContent}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
      
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(5, 40px)', 
          gap: '4px',
          marginBottom: '30px'
        }}>
          {[...Array(25)].map((_, i) => (
            <motion.div
              key={i}
              style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '4px'
              }}
              animate={{ 
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1, 0.8]
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.05
              }}
            />
          ))}
        </div>

        <h2 className={styles.gameLoadingTitle}>{message}</h2>
        
       
        <motion.div 
          className={styles.pulseLoader}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
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


export const SkeletonLoader = ({ lines = 3, width = '100%', height = '20px' }) => {
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
        />
      ))}
    </div>
  );
};