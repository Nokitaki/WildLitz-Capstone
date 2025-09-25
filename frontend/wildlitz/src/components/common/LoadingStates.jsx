// src/components/common/LoadingStates.jsx
import React from 'react';
import { motion } from 'framer-motion';
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

// Story generation loading with progress
export const StoryLoadingScreen = ({ progress = 0, message = 'Creating your adventure...', showWarning = false }) => {
  const progressMessages = [
    "🌟 Choosing the perfect adventure theme...",
    "📝 Writing an engaging story just for you...",
    "🧩 Creating fun crossword puzzles...",
    "🎨 Adding colorful details and characters...",
    "✨ Adding final magical touches...",
    "🎉 Almost ready for your reading adventure!"
  ];

  const currentMessage = progressMessages[Math.min(Math.floor(progress / 20), progressMessages.length - 1)];

  return (
    <div className={styles.storyLoadingContainer}>
      <motion.div 
        className={styles.storyLoadingContent}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Animated book icon */}
        <motion.div 
          className={styles.bookIcon}
          animate={{ rotateY: [0, 180, 360] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          📖
        </motion.div>

        {/* Progress bar */}
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <motion.div 
              className={styles.progressFill}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className={styles.progressText}>{Math.round(progress)}%</p>
        </div>

        {/* Dynamic message */}
        <motion.p 
          key={currentMessage}
          className={styles.progressMessage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {currentMessage}
        </motion.p>

        {/* Warning for slow connection */}
        {showWarning && (
          <motion.div 
            className={styles.warningMessage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className={styles.warningIcon}>⏰</div>
            <p>This is taking longer than expected. We're working hard to create something amazing for you!</p>
          </motion.div>
        )}

        {/* Loading dots animation */}
        <div className={styles.loadingDots}>
          <motion.span 
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0 }}
          >.</motion.span>
          <motion.span 
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
          >.</motion.span>
          <motion.span 
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
          >.</motion.span>
        </div>
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
            color: ['#333', '#007bff', '#333']
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