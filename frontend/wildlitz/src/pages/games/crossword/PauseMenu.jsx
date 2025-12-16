// src/pages/games/crossword/PauseMenu.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import styles from '../../../styles/games/crossword/PauseMenu.module.css';

const PauseMenu = ({ 
  onBackToStory = null,
  onMainMenu,
  onStoryGenerator,
  customMessage = "What would you like to do?",
  onMenuStateChange = null
}) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showMainMenuConfirmation, setShowMainMenuConfirmation] = useState(false);

  const handleMenuClick = () => {
    setShowMenu(true);
    if (onMenuStateChange) onMenuStateChange(true);
  };

  const handleClose = () => {
    setShowMenu(false);
    if (onMenuStateChange) onMenuStateChange(false);
  };

  const handleBackToStory = () => {
    setShowMenu(false);
    if (onMenuStateChange) onMenuStateChange(false);
    if (onBackToStory) onBackToStory();
  };

  const handleMainMenu = () => {
    setShowMainMenuConfirmation(true);
  };

  const handleConfirmMainMenu = () => {
    setShowMainMenuConfirmation(false);
    setShowMenu(false);
    if (onMenuStateChange) onMenuStateChange(false);
    setTimeout(() => {
      navigate('/home');
    }, 200);
  };

  const handleCancelMainMenuConfirmation = () => {
    setShowMainMenuConfirmation(false);
  };

  const handleStoryGenerator = () => {
    setShowConfirmation(true);
  };

  const handleConfirmStoryGenerator = () => {
    setShowConfirmation(false);
    setShowMenu(false);
    if (onMenuStateChange) onMenuStateChange(false);
    setTimeout(() => {
      if (onStoryGenerator) onStoryGenerator();
    }, 200);
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
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

      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && (
          <>
            {/* Backdrop */}
            <motion.div
              className={styles.backdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ zIndex: 10000 }}
            />

            {/* Confirmation Container */}
            <motion.div
              className={styles.menuContainer}
              initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={{ 
                zIndex: 10001,
                background: 'linear-gradient(135deg, #fff5e6 0%, #ffe0b3 100%)',
                border: '4px solid #ffcc80'
              }}
            >
              {/* Sparkle Effects */}
              <div className={styles.particles}>
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    style={{
                      position: 'absolute',
                      fontSize: '24px',
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0],
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  >
                    ✨
                  </motion.div>
                ))}
              </div>

              {/* Emoji animation */}
              <motion.div
                className={styles.emojiContainer}
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <span className={styles.emoji}>✨</span>
              </motion.div>

              {/* Title */}
              <motion.h2
                className={styles.menuTitle}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{ color: '#f57c00' }}
              >
                New Story?
              </motion.h2>

              {/* Message */}
              <motion.p
                className={styles.menuMessage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                style={{ fontWeight: 500 }}
              >
                Are you sure you want to return to the Story Generator screen?
              </motion.p>

              {/* Confirmation Buttons */}
              <motion.div
                style={{
                  display: 'flex',
                  gap: '12px',
                  width: '100%',
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {/* Cancel Button */}
                <motion.button
                  className={styles.menuOption}
                  onClick={handleCancelConfirmation}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #9e9e9e 0%, #757575 100%)',
                    color: 'white',
                    boxShadow: '0 4px 15px rgba(158, 158, 158, 0.3)',
                  }}
                >
                  <span className={styles.optionText}>Cancel</span>
                </motion.button>

                {/* Confirm Button */}
                <motion.button
                  className={`${styles.menuOption} ${styles.generatorButton}`}
                  onClick={handleConfirmStoryGenerator}
                  whileHover={{ scale: 1.05, boxShadow: '0 8px 25px rgba(255, 152, 0, 0.4)' }}
                  whileTap={{ scale: 0.95 }}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <span className={styles.optionText}>Yes, Continue</span>
                </motion.button>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Menu Confirmation Modal */}
      <AnimatePresence>
        {showMainMenuConfirmation && (
          <>
            {/* Backdrop */}
            <motion.div
              className={styles.backdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ zIndex: 10000 }}
            />

            {/* Confirmation Container */}
            <motion.div
              className={styles.menuContainer}
              initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={{ 
                zIndex: 10001,
                background: 'linear-gradient(135deg, #ffe6e6 0%, #ffb3b3 100%)',
                border: '4px solid #ff8080'
              }}
            >
              {/* Sparkle Effects */}
              <div className={styles.particles}>
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    style={{
                      position: 'absolute',
                      fontSize: '24px',
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0],
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  >
                    🏠
                  </motion.div>
                ))}
              </div>

              {/* Emoji animation */}
              <motion.div
                className={styles.emojiContainer}
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <span className={styles.emoji}>🏠</span>
              </motion.div>

              {/* Title */}
              <motion.h2
                className={styles.menuTitle}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{ color: '#d32f2f' }}
              >
                Return to Main Menu?
              </motion.h2>

              {/* Message */}
              <motion.p
                className={styles.menuMessage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                style={{ fontWeight: 500 }}
              >
                Are you sure you want to return to the Main Menu? Your progress will be saved.
              </motion.p>

              {/* Confirmation Buttons */}
              <motion.div
                style={{
                  display: 'flex',
                  gap: '12px',
                  width: '100%',
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {/* Cancel Button */}
                <motion.button
                  className={styles.menuOption}
                  onClick={handleCancelMainMenuConfirmation}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #9e9e9e 0%, #757575 100%)',
                    color: 'white',
                    boxShadow: '0 4px 15px rgba(158, 158, 158, 0.3)',
                  }}
                >
                  <span className={styles.optionText}>Cancel</span>
                </motion.button>

                {/* Confirm Button */}
                <motion.button
                  className={`${styles.menuOption} ${styles.mainMenuButton}`}
                  onClick={handleConfirmMainMenu}
                  whileHover={{ scale: 1.05, boxShadow: '0 8px 25px rgba(244, 67, 54, 0.4)' }}
                  whileTap={{ scale: 0.95 }}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <span className={styles.optionText}>Yes, Go Home</span>
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