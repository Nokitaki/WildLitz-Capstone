// src/pages/games/crossword/CrosswordQuickTip.jsx
// Compact tip component for gameplay screen

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lightbulb } from 'lucide-react';
import styles from '../../../styles/games/crossword/CrosswordQuickTip.module.css';

const CrosswordQuickTip = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if tip has been seen before
    const tipSeen = localStorage.getItem('wildlitz_crossword_quick_tip_seen');
    if (!tipSeen) {
      // Show tip after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('wildlitz_crossword_quick_tip_seen', 'true');
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={styles.tipContainer}
        initial={{ opacity: 0, scale: 0.8, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -20 }}
        transition={{ type: "spring", duration: 0.4 }}
      >
        <button 
          className={styles.closeButton}
          onClick={handleClose}
          aria-label="Close tip"
        >
          <X size={18} />
        </button>

        <div className={styles.tipHeader}>
          <Lightbulb className={styles.tipIcon} size={24} />
          <h3 className={styles.tipTitle}>Quick Tips</h3>
        </div>

        <div className={styles.tipContent}>
          <div className={styles.tipItem}>
            <span className={styles.tipNumber}>1</span>
            <span className={styles.tipText}>Click a number to select a clue</span>
          </div>
          <div className={styles.tipItem}>
            <span className={styles.tipNumber}>2</span>
            <span className={styles.tipText}>Pick the correct answer</span>
          </div>
          <div className={styles.tipItem}>
            <span className={styles.tipNumber}>3</span>
            <span className={styles.tipText}>Use hints if you need help!</span>
          </div>
        </div>

        <button 
          className={styles.gotItButton}
          onClick={handleClose}
        >
          Got it! ✨
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default CrosswordQuickTip;