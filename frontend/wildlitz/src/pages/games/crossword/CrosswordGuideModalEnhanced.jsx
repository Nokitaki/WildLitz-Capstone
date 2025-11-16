// src/pages/games/crossword/CrosswordGuideModalEnhanced.jsx
// OVERLAY VERSION - Appears on top of gameplay screen

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import styles from '../../../styles/games/crossword/CrosswordGuideModal.module.css';

const CrosswordGuideModalEnhanced = ({ onStart, onSkip, isVisible = true }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Check if guide should be shown
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('wildlitz_crossword_guide_seen');
    if (hasSeenGuide === 'true' && isVisible) {
      // Auto-skip if they've seen it before
      onStart();
    }
  }, [isVisible, onStart]);

  const instructions = [
    {
      icon: '📖',
      title: 'Read the Clues',
      description: 'Each clue helps you find a word from the story.'
    },
    {
      icon: '🎯',
      title: 'Select a Clue',
      description: 'Click any clue to see answer choices.'
    },
    {
      icon: '✅',
      title: 'Choose Answer',
      description: 'Pick the correct word from the options.'
    },
    {
      icon: '🎉',
      title: 'Complete Puzzle',
      description: 'Solve all clues to continue the story!'
    }
  ];

  const handleStart = () => {
    if (dontShowAgain) {
      localStorage.setItem('wildlitz_crossword_guide_seen', 'true');
    }
    onStart();
  };

  const handleSkip = () => {
    if (dontShowAgain) {
      localStorage.setItem('wildlitz_crossword_guide_seen', 'true');
    }
    if (onSkip) {
      onSkip();
    } else {
      onStart();
    }
  };

  // Don't render if not visible or already seen
  const hasSeenGuide = localStorage.getItem('wildlitz_crossword_guide_seen');
  if (!isVisible || hasSeenGuide === 'true') return null;

  return (
    <AnimatePresence>
      {/* Dark Overlay Backdrop */}
      <motion.div
        className={styles.modalOverlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Modal Container */}
        <motion.div 
          className={styles.modalContainer}
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button 
            className={styles.closeButton}
            onClick={handleSkip}
            aria-label="Skip guide"
          >
            <X size={20} />
          </button>

          {/* Header */}
          <div className={styles.modalHeader}>
            <motion.div 
              className={styles.modalIcon}
              animate={{ 
                rotate: [0, -10, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3
              }}
            >
              🧩
            </motion.div>
            <h2 className={styles.modalTitle}>How to Play</h2>
            <p className={styles.modalSubtitle}>
              Let's solve this puzzle together!
            </p>
          </div>

          {/* Instructions Grid - 2x2 */}
          <div className={styles.instructionsGrid}>
            {instructions.map((instruction, index) => (
              <motion.div
                key={index}
                className={styles.instructionCard}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, type: "spring" }}
                whileHover={{ 
                  scale: 1.05,
                  transition: { duration: 0.2 }
                }}
              >
                <div className={styles.cardNumber}>{index + 1}</div>
                <div className={styles.cardIcon}>{instruction.icon}</div>
                <h3 className={styles.cardTitle}>{instruction.title}</h3>
                <p className={styles.cardDescription}>{instruction.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Don't show again checkbox */}
          <motion.div 
            className={styles.checkboxSection}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className={styles.checkbox}
              />
              <span>Don't show this again</span>
            </label>
          </motion.div>

          {/* Start button */}
          <motion.button
            className={styles.startButton}
            onClick={handleStart}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            Start Puzzle! 🚀
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CrosswordGuideModalEnhanced;