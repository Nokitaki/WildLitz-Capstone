// src/pages/games/crossword/PauseMenu.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../../styles/games/crossword/PauseMenu.module.css';

const PauseMenu = ({ 
  onBackToStory = null, // null if not applicable (e.g., in StoryScreen)
  onMainMenu,
  onStoryGenerator,
  customMessage = "What would you like to do?"
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleMenuClick = () => {
    setShowMenu(true);
  };

  const handleClose = () => {
    setShowMenu(false);
  };

  const handleBackToStory = () => {
    setShowMenu(false);
    if (onBackToStory) onBackToStory();
  };

  const handleMainMenu = () => {
    setShowMenu(false);
    if (onMainMenu) onMainMenu();
  };

  const handleStoryGenerator = () => {
    setShowMenu(false);
    if (onStoryGenerator) onStoryGenerator();
  };

  return (
    <>
      {/* Menu Button */}
      <motion.button
        className={styles.menuButton}
        onClick={handleMenuClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <svg 
          className={styles.menuIcon} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2.5} 
            d="M4 6h16M4 12h16M4 18h16" 
          />
        </svg>
        <span className={styles.menuText}>Menu</span>
      </motion.button>

      {/* Pause Menu Modal */}
      <AnimatePresence>
        {showMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              className={styles.backdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
            />

            {/* Menu Container */}
            <motion.div
              className={styles.menuContainer}
              initial={{ opacity: 0, scale: 0.8, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              {/* Floating particles */}
              <div className={styles.particles}>
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className={styles.particle}
                    animate={{
                      y: [0, -20, 0],
                      x: [0, Math.random() * 20 - 10, 0],
                      opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 2 + Math.random(),
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                  />
                ))}
              </div>

              {/* Emoji animation */}
              <motion.div
                className={styles.emojiContainer}
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, -5, 5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <span className={styles.emoji}>⏸️</span>
              </motion.div>

              {/* Title */}
              <motion.h2
                className={styles.menuTitle}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                Game Paused
              </motion.h2>

              {/* Message */}
              <motion.p
                className={styles.menuMessage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {customMessage}
              </motion.p>

              {/* Menu Options */}
              <motion.div
                className={styles.menuOptions}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {/* Resume Button */}
                <motion.button
                  className={`${styles.menuOption} ${styles.resumeButton}`}
                  onClick={handleClose}
                  whileHover={{ scale: 1.05, boxShadow: '0 8px 25px rgba(76, 175, 80, 0.3)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className={styles.optionIcon}>▶️</span>
                  <span className={styles.optionText}>Resume Game</span>
                </motion.button>

                {/* Back to Story (only if available) */}
                {onBackToStory && (
                  <motion.button
                    className={`${styles.menuOption} ${styles.storyButton}`}
                    onClick={handleBackToStory}
                    whileHover={{ scale: 1.05, boxShadow: '0 8px 25px rgba(33, 150, 243, 0.3)' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className={styles.optionIcon}>📖</span>
                    <span className={styles.optionText}>Back to Story</span>
                  </motion.button>
                )}

                {/* Story Generator */}
                <motion.button
                  className={`${styles.menuOption} ${styles.generatorButton}`}
                  onClick={handleStoryGenerator}
                  whileHover={{ scale: 1.05, boxShadow: '0 8px 25px rgba(255, 152, 0, 0.3)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className={styles.optionIcon}>✨</span>
                  <span className={styles.optionText}>New Story</span>
                </motion.button>

                {/* Main Menu */}
                <motion.button
                  className={`${styles.menuOption} ${styles.mainMenuButton}`}
                  onClick={handleMainMenu}
                  whileHover={{ scale: 1.05, boxShadow: '0 8px 25px rgba(244, 67, 54, 0.3)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className={styles.optionIcon}>🏠</span>
                  <span className={styles.optionText}>Main Menu</span>
                </motion.button>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default PauseMenu;