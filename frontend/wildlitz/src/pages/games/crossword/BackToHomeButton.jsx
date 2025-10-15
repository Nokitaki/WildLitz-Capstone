// src/components/common/BackToHomeButton.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../../styles/games/crossword/BackToHomeButton.module.css';

const BackToHomeButton = ({ 
  position = 'top-left', // 'top-left', 'top-right', 'bottom-left', 'bottom-right'
  showIcon = true,
  customMessage = null
}) => {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const handleBackClick = () => {
    setShowModal(true);
  };

  const handleConfirmExit = () => {
    setShowModal(false);
    navigate('/home');
  };

  const handleCancelExit = () => {
    setShowModal(false);
  };

  const positionClasses = {
    'top-left': styles.topLeft,
    'top-right': styles.topRight,
    'bottom-left': styles.bottomLeft,
    'bottom-right': styles.bottomRight
  };

  return (
    <>
      {/* Back Button */}
      <motion.button
        className={`${styles.backButton} ${positionClasses[position]}`}
        onClick={handleBackClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, x: position.includes('left') ? -50 : 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {showIcon && (
          <svg 
            className={styles.icon} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2.5} 
              d="M10 19l-7-7m0 0l7-7m-7 7h18" 
            />
          </svg>
        )}
        <span className={styles.buttonText}>Home</span>
      </motion.button>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            {/* Backdrop */}
            <motion.div
              className={styles.backdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancelExit}
            />

            {/* Modal */}
            <motion.div
              className={styles.modalContainer}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
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

              {/* Sad emoji animation */}
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
                <span className={styles.emoji}>😢</span>
              </motion.div>

              {/* Title */}
              <motion.h2
                className={styles.modalTitle}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                Leaving Already?
              </motion.h2>

              {/* Message */}
              <motion.p
                className={styles.modalMessage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {customMessage || "Are you sure you want to quit the game? Your progress will be lost!"}
              </motion.p>

              {/* Action Buttons */}
              <motion.div
                className={styles.buttonGroup}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <motion.button
                  className={styles.cancelButton}
                  onClick={handleCancelExit}
                  whileHover={{ scale: 1.05, boxShadow: '0 8px 25px rgba(76, 175, 80, 0.3)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg className={styles.buttonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Keep Playing!
                </motion.button>

                <motion.button
                  className={styles.confirmButton}
                  onClick={handleConfirmExit}
                  whileHover={{ scale: 1.05, boxShadow: '0 8px 25px rgba(244, 67, 54, 0.3)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg className={styles.buttonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Yes, Go Home
                </motion.button>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default BackToHomeButton;