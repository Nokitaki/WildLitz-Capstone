// src/components/crossword/CrosswordGuideModalEnhanced.jsx
// ENHANCED VERSION with "Don't show again" option and localStorage persistence

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import styles from './CrosswordGuideModal.module.css';

const CrosswordGuideModalEnhanced = ({ onStart, onSkip, storyContext }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const instructions = [
    {
      icon: '📖',
      title: 'Read the Clues',
      description: 'Each clue helps you find a word from the story. Read them carefully!'
    },
    {
      icon: '🎯',
      title: 'Select a Clue',
      description: 'Click on any clue to see the answer choices for that word.'
    },
    {
      icon: '✅',
      title: 'Choose Your Answer',
      description: 'Pick the correct word from the multiple choice options.'
    },
    {
      icon: '🧩',
      title: 'Fill the Grid',
      description: 'Watch the word appear in the crossword grid when you get it right!'
    },
    {
      icon: '💡',
      title: 'Use Hints Wisely',
      description: 'If you\'re stuck, use a hint to reveal a letter in the word.'
    },
    {
      icon: '🎉',
      title: 'Complete All Words',
      description: 'Solve all the clues to finish the puzzle and continue the story!'
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
    onSkip();
  };

  return (
    <div className={styles.overlay}>
      <motion.div 
        className={styles.modal}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.iconContainer}>
            <span className={styles.mainIcon}>🧩</span>
          </div>
          <h2 className={styles.title}>How to Play Crossword</h2>
          <p className={styles.subtitle}>
            Let's solve this puzzle together and continue the adventure!
          </p>
        </div>

        {/* Instructions Grid */}
        <div className={styles.instructionsGrid}>
          {instructions.map((instruction, index) => (
            <motion.div
              key={index}
              className={styles.instructionCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className={styles.stepNumber}>{index + 1}</div>
              <div className={styles.instructionIcon}>{instruction.icon}</div>
              <h3 className={styles.instructionTitle}>{instruction.title}</h3>
              <p className={styles.instructionDesc}>{instruction.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Tips Section */}
        <div className={styles.tipsSection}>
          <h3 className={styles.tipsTitle}>💫 Pro Tips:</h3>
          <ul className={styles.tipsList}>
            <li>Start with the clues you know best</li>
            <li>Think about words from the story you just read</li>
            <li>Save your hints for the harder clues</li>
            <li>Take your time - there's no rush!</li>
          </ul>
        </div>

        {/* "Don't show again" Checkbox */}
        <div className={styles.checkboxContainer}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className={styles.checkbox}
            />
            <span>Don't show this guide again</span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className={styles.buttonContainer}>
         
          <motion.button
            className={styles.startButton}
            onClick={handleStart}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Start Puzzle! 🚀
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default CrosswordGuideModalEnhanced;


